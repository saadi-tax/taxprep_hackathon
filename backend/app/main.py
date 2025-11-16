import base64
import io
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Generator, List, Literal, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from mcp.server.fastmcp import FastMCP
from openai import OpenAI
from pdf2image import convert_from_bytes
from pydantic import BaseModel, ConfigDict, Field
from pypdf import PdfReader
from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

# ---------- CONFIG ----------
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "taxdocs.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------- DATABASE SETUP ----------
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class TaxDocumentORM(Base):
    __tablename__ = "tax_documents"

    id = Column(String, primary_key=True, index=True)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    doc_type = Column(String, nullable=False, default="unknown")
    tax_year = Column(Integer, nullable=True)
    payer_name = Column(String, nullable=True)
    taxpayer_name = Column(String, nullable=True)
    num_pages = Column(Integer, nullable=False, default=0)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    full_text = Column(Text, nullable=False, default="")
    status = Column(String, nullable=False, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)


Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Pydantic MODELS ----------
class TaxDocumentMetadata(BaseModel):
    id: str
    original_filename: str
    doc_type: str
    tax_year: Optional[int]
    payer_name: Optional[str]
    taxpayer_name: Optional[str]
    num_pages: int
    ingested_at: datetime
    status: str = "pending"  # pending, processing, completed, failed
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TaxDocumentTextResponse(BaseModel):
    id: str
    full_text: str

    model_config = ConfigDict(from_attributes=True)


# ---------- LLM EXTRACTION MODELS ----------
class TaxDocumentExtraction(BaseModel):
    """Structured extraction of tax document metadata using LLM."""

    doc_type: Literal[
        "w2",
        "1099_int",
        "1099_div",
        "1099_nec",
        "1099_misc",
        "1099_b",
        "1099_g",
        "1099_r",
        "1099_sa",
        "1098",
        "1098_e",
        "1098_t",
        "w2g",
        "brokerage_statement",
        "k1",
        "schedule_c",
        "schedule_e",
        "schedule_k",
        "other",
        "unknown",
    ] = Field(
        description="The specific tax form type. Use 'other' for recognized tax documents that don't match standard forms, and 'unknown' only if the document cannot be identified as a tax document.",
    )

    tax_year: Optional[int] = Field(
        None,
        ge=2000,
        le=2035,
        description="The tax year this document pertains to. Extract from form headers, dates, or context. Must be between 2000-2035.",
    )

    payer_name: Optional[str] = Field(
        None,
        description="The name of the entity issuing the document (employer, payer, financial institution, etc.). Extract the full legal or business name. Return None if not found.",
    )

    taxpayer_name: Optional[str] = Field(
        None,
        description="The name of the taxpayer/recipient/employee. Extract full name as it appears on the form. Return None if not found.",
    )

    taxpayer_ssn: Optional[str] = Field(
        None,
        description="Social Security Number or Taxpayer Identification Number if present. Return None if not found or partially redacted.",
    )

    payer_ein: Optional[str] = Field(
        None,
        description="Employer Identification Number (EIN) of the payer/employer if present. Return None if not found.",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0-1.0) for the overall extraction accuracy based on document clarity and completeness.",
    )

    extraction_notes: Optional[str] = Field(
        None,
        description="Any relevant notes about ambiguities, missing information, or special circumstances encountered during extraction.",
    )


# ---------- PDF UTILITIES ----------
def extract_text_and_page_count(file_bytes: bytes) -> tuple[str, int]:
    """Extract raw text and page count from a PDF. Uses image extraction if text is empty."""

    reader = PdfReader(io.BytesIO(file_bytes))
    num_pages = len(reader.pages)
    full_text_parts: list[str] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        full_text_parts.append(text)

    full_text = "\n".join(full_text_parts).strip()

    # If extracted text is empty or very minimal (likely image-based PDF), use LLM vision extraction
    if not full_text or len(full_text) < 50:
        try:
            full_text = extract_text_from_pdf_images(file_bytes, num_pages)
        except Exception as exc:
            # If image extraction fails, log but don't fail completely
            # Return minimal text with error note
            full_text = f"[Image-based PDF - OCR extraction failed: {str(exc)}]"

    return full_text, num_pages


# ---------- IMAGE TEXT EXTRACTION MODELS ----------
class ImageTextExtraction(BaseModel):
    """Structured extraction of text from image-based tax documents."""

    extracted_text: str = Field(
        description="All text content extracted from the image(s), preserving structure, line breaks, and formatting as much as possible. Include all visible text including form labels, values, numbers, and any handwritten text if legible.",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0-1.0) for the text extraction accuracy based on image quality, clarity, and completeness.",
    )

    extraction_notes: Optional[str] = Field(
        None,
        description="Any relevant notes about image quality issues, unclear text, partial occlusions, or special formatting encountered.",
    )


# ---------- IMAGE TEXT EXTRACTION ----------
def extract_text_from_pdf_images(
    file_bytes: bytes,
    num_pages: int,
) -> str:
    """Extract text from image-based PDF using LLM vision API with structured outputs."""

    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY not configured. Set TAXGPT_OPENAI_API_KEY or OPENAI_API_KEY environment variable.",
        )

    client = OpenAI(api_key=api_key)

    # Convert PDF pages to images
    try:
        images = convert_from_bytes(file_bytes, dpi=300, first_page=1, last_page=num_pages)
    except Exception as exc:
        raise ValueError(f"Failed to convert PDF to images: {str(exc)}") from exc

    if not images:
        raise ValueError("No images extracted from PDF")

    # Process each page and combine text
    all_extracted_text = []
    total_confidence = 0.0

    for page_num, image in enumerate(images, start=1):
        # Convert image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        prompt = f"""<task>
You are an expert OCR and tax document text extraction system. Extract ALL visible text from this tax document image with maximum accuracy.

<image_context>
This is page {page_num} of {num_pages} from a tax document PDF. The document may be a scanned image or image-based PDF.
</image_context>

<instructions>
1. Extract ALL text visible in the image, including:
   - Form labels and field names (e.g., "Form W-2", "Employer's name", "Social Security Number")
   - All numerical values (wages, taxes, amounts, years, SSNs, EINs)
   - Names (employer, employee, payer, recipient)
   - Dates and tax years
   - Any handwritten text if legible
   - Checkboxes and their states if applicable

2. Preserve the structure and layout:
   - Maintain line breaks where text appears on separate lines
   - Group related information together
   - Keep field labels with their corresponding values

3. Be thorough and accurate:
   - Read numbers carefully (distinguish 0 from O, 1 from I, etc.)
   - Extract partial text even if some parts are unclear
   - Note any unclear or illegible sections in extraction_notes

4. For multi-page documents, extract text from this page only.
</instructions>

<output_format>
Return a structured object with the extracted text, confidence score, and any relevant notes about image quality or unclear text.
</output_format>
</task>"""

        try:
            # Use chat completions with vision for image processing
            response = client.chat.completions.create(
                model="gpt-5-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise OCR system specialized in extracting text from tax documents. Extract all visible text accurately and completely.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{img_base64}",
                                    "detail": "high",  # High detail for better OCR
                                },
                            },
                        ],
                    },
                ],
                max_completion_tokens=10000,  # Enough tokens for full text extraction
            )

            page_text = response.choices[0].message.content or ""
            all_extracted_text.append(f"--- Page {page_num} ---\n{page_text}")

        except Exception as exc:
            raise ValueError(f"Failed to extract text from page {page_num}: {str(exc)}") from exc

    # Combine all pages
    combined_text = "\n\n".join(all_extracted_text)

    # Use structured outputs to get final extraction with confidence
    try:
        structured_response = client.responses.parse(
            model="gpt-4o-mini",
            input=[
                {
                    "role": "system",
                    "content": "You are a text extraction quality assessment system. Review extracted OCR text and provide structured output with confidence scores.",
                },
                {
                    "role": "user",
                    "content": f"""<task>
Review the following OCR-extracted text from a tax document and provide a structured assessment.

<extracted_text>
{combined_text[:100000]}  <!-- Truncated if very long -->
</extracted_text>

<instructions>
1. Provide the complete extracted text in the extracted_text field
2. Assess overall confidence (0.0-1.0) based on:
   - Text completeness and readability
   - Presence of key tax document elements
   - Clarity of numbers and names
3. Note any issues in extraction_notes (blurry text, missing sections, unclear handwriting, etc.)
</instructions>
</task>""",
                },
            ],
            text_format=ImageTextExtraction,
        )

        final_extraction = structured_response.output_parsed
        if not isinstance(final_extraction, ImageTextExtraction):
            # Fallback to raw text if structured extraction fails
            return combined_text

        return final_extraction.extracted_text

    except Exception:
        # Fallback to raw extracted text if structured processing fails
        return combined_text


# ---------- LLM EXTRACTION ----------
def extract_document_metadata_with_llm(text: str) -> TaxDocumentExtraction:
    """Extract comprehensive tax document metadata using OpenAI Responses API with structured outputs."""

    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY not configured. Set TAXGPT_OPENAI_API_KEY or OPENAI_API_KEY environment variable.",
        )

    client = OpenAI(api_key=api_key)

    prompt = f"""<task>
You are an expert tax document analyst. Analyze the following extracted text from a tax document PDF and extract all relevant metadata with high accuracy.

<document_text>
{text[:15000]}  <!-- Truncated to 15k chars if longer -->
</document_text>

<instructions>
1. Identify the specific tax form type (W-2, 1099 variants, 1098, etc.)
2. Extract the tax year from form headers, dates, or context clues
3. Extract payer/employer name (full legal or business name)
4. Extract taxpayer/recipient/employee name (full name as shown)
5. Extract SSN/TIN and EIN if present and clearly visible
6. Assess your confidence in the extraction (0.0-1.0)
7. Note any ambiguities or missing information

Be precise and conservative. Only extract information you are confident about. If a field cannot be reliably determined, set it to None.
</instructions>

<output_format>
Return a structured JSON object matching the TaxDocumentExtraction schema with all fields properly typed.
</output_format>
</task>"""

    try:
        response = client.responses.parse(
            model="gpt-5-mini",
            input=[
                {
                    "role": "system",
                    "content": "You are a precise tax document extraction system. Always return valid structured data matching the provided schema.",
                },
                {"role": "user", "content": prompt},
            ],
            text_format=TaxDocumentExtraction,
        )

        # Check for incomplete responses
        if hasattr(response, "status") and response.status == "incomplete":
            incomplete_details = getattr(response, "incomplete_details", None)
            reason = getattr(incomplete_details, "reason", "unknown") if incomplete_details else "unknown"
            raise ValueError(f"Incomplete response from model: {reason}")

        # Check for refusals in output
        if hasattr(response, "output") and response.output:
            for output_item in response.output:
                if hasattr(output_item, "content") and output_item.content:
                    for content_item in output_item.content:
                        if hasattr(content_item, "type") and content_item.type == "refusal":
                            refusal_msg = getattr(content_item, "refusal", "Unknown reason")
                            raise ValueError(f"Model refused to process the document: {refusal_msg}")

        # Get parsed output
        extraction = response.output_parsed
        if extraction is None:
            raise ValueError("LLM returned null extraction")
        if not isinstance(extraction, TaxDocumentExtraction):
            raise ValueError("LLM returned invalid extraction format")

        return extraction

    except HTTPException:
        raise
    except ValueError as exc:
        # Re-raise ValueError as HTTPException for better error handling
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract document metadata: {str(exc)}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract document metadata with LLM: {str(exc)}",
        ) from exc


# ---------- FASTAPI APP ----------
app = FastAPI(title="Tax Document Ingestion + MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def process_document_async(doc_id: str, file_bytes: bytes, original_filename: str) -> None:
    """Background task to process document extraction."""
    db = SessionLocal()
    try:
        # Update status to processing
        db_doc = db.get(TaxDocumentORM, doc_id)
        if not db_doc:
            return

        db_doc.status = "processing"
        db.commit()

        try:
            # Extract text and page count
            full_text, num_pages = extract_text_and_page_count(file_bytes)

            # Extract metadata using LLM with structured outputs
            extraction = extract_document_metadata_with_llm(full_text)

            # Update document with extracted data
            db_doc.doc_type = extraction.doc_type
            db_doc.tax_year = extraction.tax_year
            db_doc.payer_name = extraction.payer_name
            db_doc.taxpayer_name = extraction.taxpayer_name
            db_doc.num_pages = num_pages
            db_doc.full_text = full_text
            db_doc.status = "completed"
            db_doc.error_message = None

            db.commit()

        except Exception as exc:
            # Mark as failed with error message
            db_doc.status = "failed"
            db_doc.error_message = str(exc)[:500]  # Limit error message length
            db.commit()

    finally:
        db.close()


@app.post(
    "/api/documents/ingest",
    response_model=TaxDocumentMetadata,
    summary="Ingest a new tax document PDF",
)
async def ingest_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
) -> TaxDocumentMetadata:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()

    # Create document record immediately with pending status
    doc_id = str(uuid.uuid4())
    storage_path = UPLOAD_DIR / f"{doc_id}.pdf"
    with storage_path.open("wb") as f:
        f.write(file_bytes)

    # Create document with pending status
    db_doc = TaxDocumentORM(
        id=doc_id,
        original_filename=file.filename or f"{doc_id}.pdf",
        storage_path=str(storage_path),
        doc_type="unknown",
        num_pages=0,
        full_text="",
        status="pending",
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Queue background task for processing
    background_tasks.add_task(process_document_async, doc_id, file_bytes, file.filename or "")

    return db_doc


@app.get(
    "/api/documents",
    response_model=List[TaxDocumentMetadata],
    summary="List ingested tax documents",
)
def list_documents(
    tax_year: Optional[int] = None,
    doc_type: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[TaxDocumentMetadata]:
    query = db.query(TaxDocumentORM)
    if tax_year is not None:
        query = query.filter(TaxDocumentORM.tax_year == tax_year)
    if doc_type is not None:
        query = query.filter(TaxDocumentORM.doc_type == doc_type)

    docs = query.order_by(TaxDocumentORM.ingested_at.desc()).all()
    return docs


@app.get(
    "/api/documents/{doc_id}",
    response_model=TaxDocumentMetadata,
    summary="Get metadata and status for a specific document",
)
def get_document_metadata(doc_id: str, db: Session = Depends(get_db)) -> TaxDocumentMetadata:
    """Get document metadata including processing status."""
    doc = db.get(TaxDocumentORM, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.get(
    "/api/documents/{doc_id}/text",
    response_model=TaxDocumentTextResponse,
    summary="Get full extracted text for a document",
)
def get_document_text(doc_id: str, db: Session = Depends(get_db)) -> TaxDocumentTextResponse:
    doc = db.get(TaxDocumentORM, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return TaxDocumentTextResponse.model_validate(doc, from_attributes=True)


@app.get(
    "/api/documents/{doc_id}/file",
    response_class=FileResponse,
    summary="Download / view original PDF file",
)
def get_document_file(doc_id: str, db: Session = Depends(get_db)) -> FileResponse:
    doc = db.get(TaxDocumentORM, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    storage_path = Path(doc.storage_path)
    if not storage_path.exists():
        raise HTTPException(status_code=500, detail="Stored file is missing on disk")

    return FileResponse(
        storage_path,
        media_type="application/pdf",
        filename=doc.original_filename,
    )


@app.get("/healthz", tags=["health"])
def healthcheck() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok"}


@app.delete(
    "/api/documents",
    summary="Delete all documents",
)
def delete_all_documents(db: Session = Depends(get_db)) -> dict:
    """Delete all documents from database and file system."""
    docs = db.query(TaxDocumentORM).all()
    deleted_count = 0

    for doc in docs:
        # Delete file from disk
        storage_path = Path(doc.storage_path)
        if storage_path.exists():
            try:
                storage_path.unlink()
            except Exception:
                pass  # Continue even if file deletion fails

        # Delete from database
        db.delete(doc)
        deleted_count += 1

    db.commit()

    return {"deleted_count": deleted_count, "message": f"Deleted {deleted_count} document(s)"}


# ---------- MCP SERVER (Streamable HTTP) ----------
mcp_server = FastMCP(name="tax-documents-mcp", streamable_http_path="/")


def to_metadata(doc: TaxDocumentORM) -> TaxDocumentMetadata:
    return TaxDocumentMetadata.model_validate(doc, from_attributes=True)


@mcp_server.tool()
def list_tax_documents(
    tax_year: Optional[int] = None,
    doc_type: Optional[str] = None,
) -> List[TaxDocumentMetadata]:
    """List tax documents, optionally filtered by year and type."""

    db = SessionLocal()
    try:
        query = db.query(TaxDocumentORM)
        if tax_year is not None:
            query = query.filter(TaxDocumentORM.tax_year == tax_year)
        if doc_type is not None:
            query = query.filter(TaxDocumentORM.doc_type == doc_type)

        docs = query.order_by(TaxDocumentORM.ingested_at.desc()).all()
        return [to_metadata(doc) for doc in docs]
    finally:
        db.close()


@mcp_server.tool()
def get_tax_document_metadata_tool(doc_id: str) -> TaxDocumentMetadata:
    """Fetch metadata for a single tax document by id."""

    db = SessionLocal()
    try:
        doc = db.get(TaxDocumentORM, doc_id)
        if not doc:
            raise ValueError(f"Document not found: {doc_id}")
        return to_metadata(doc)
    finally:
        db.close()


@mcp_server.tool()
def get_tax_document_text_tool(doc_id: str) -> TaxDocumentTextResponse:
    """Fetch full extracted text for a tax document."""

    db = SessionLocal()
    try:
        doc = db.get(TaxDocumentORM, doc_id)
        if not doc:
            raise ValueError(f"Document not found: {doc_id}")
        return TaxDocumentTextResponse.model_validate(doc, from_attributes=True)
    finally:
        db.close()


mcp_asgi_app = mcp_server.streamable_http_app()
app.mount("/mcp", mcp_asgi_app)

# ---------- RUN ----------
# Run with:
#   uv run uvicorn app.main:app --reload
