export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface TaxDocumentMetadata {
  id: string;
  original_filename: string;
  doc_type: string;
  tax_year: number | null;
  payer_name: string | null;
  taxpayer_name: string | null;
  num_pages: number;
  ingested_at: string; // ISO datetime string
  status: DocumentStatus;
  error_message: string | null;
}

export interface TaxDocumentTextResponse {
  id: string;
  full_text: string;
}

export type DocumentType =
  | "w2"
  | "1099_int"
  | "1099_div"
  | "1099_nec"
  | "1099_misc"
  | "1099_b"
  | "1098"
  | "brokerage_statement"
  | "unknown";

