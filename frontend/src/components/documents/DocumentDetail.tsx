import { Calendar, FileText, User, Building2, Download, X } from "lucide-react";
import { useDocumentMetadata, useDocumentText } from "../../lib/hooks/useDocuments";
import { getDocumentFileUrl } from "../../lib/api/documents";
import { DocTypeBadge } from "./DocumentList";

interface DocumentDetailProps {
  docId: string;
  onClose?: () => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const DocumentDetail = ({ docId, onClose }: DocumentDetailProps) => {
  const { data: metadata, isLoading: metadataLoading } =
    useDocumentMetadata(docId);
  const { data: textData, isLoading: textLoading } = useDocumentText(docId);

  if (metadataLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Loading document...</p>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-red-600">Document not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <FileText className="h-6 w-6 text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-900">
                {metadata.original_filename}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <DocTypeBadge docType={metadata.doc_type} />
              <span className="text-slate-400">•</span>
              <span>{metadata.num_pages} page{metadata.num_pages !== 1 ? "s" : ""}</span>
              <span className="text-slate-400">•</span>
              <span>{formatDate(metadata.ingested_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={getDocumentFileUrl(docId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
          {metadata.tax_year && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">Tax Year</p>
                <p className="text-sm font-semibold text-slate-900">
                  {metadata.tax_year}
                </p>
              </div>
            </div>
          )}
          {metadata.payer_name && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">Payer</p>
                <p className="text-sm font-semibold text-slate-900">
                  {metadata.payer_name}
                </p>
              </div>
            </div>
          )}
          {metadata.taxpayer_name && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">Taxpayer</p>
                <p className="text-sm font-semibold text-slate-900">
                  {metadata.taxpayer_name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Extracted Text
          </h3>
        </div>
        <div className="p-6">
          {textLoading ? (
            <p className="text-sm text-slate-500">Loading text...</p>
          ) : textData ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-700">
              {textData.full_text || "No text extracted."}
            </pre>
          ) : (
            <p className="text-sm text-slate-500">No text available</p>
          )}
        </div>
      </div>
    </div>
  );
};

