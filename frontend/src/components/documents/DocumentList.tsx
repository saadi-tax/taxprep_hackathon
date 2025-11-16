import { FileText, Calendar, User, Building2, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useDocuments, useDeleteAllDocuments } from "../../lib/hooks/useDocuments";
import type { TaxDocumentMetadata, DocumentStatus } from "../../lib/api/types";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentModal } from "./DocumentModal";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDocType = (docType: string): string => {
  return docType
    .replace(/_/g, "-")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export const DocTypeBadge = ({ docType }: { docType: string }) => {
  const colorMap: Record<string, string> = {
    w2: "bg-blue-100 text-blue-700",
    "1099_int": "bg-green-100 text-green-700",
    "1099_div": "bg-purple-100 text-purple-700",
    "1099_nec": "bg-orange-100 text-orange-700",
    "1099_misc": "bg-yellow-100 text-yellow-700",
    "1099_b": "bg-pink-100 text-pink-700",
    "1098": "bg-indigo-100 text-indigo-700",
    brokerage_statement: "bg-teal-100 text-teal-700",
    unknown: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        colorMap[docType] ?? colorMap.unknown
      }`}
    >
      {formatDocType(docType)}
    </span>
  );
};

const StatusBadge = ({ status, errorMessage }: { status: DocumentStatus; errorMessage?: string | null }) => {
  const statusConfig: Record<DocumentStatus, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-700",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    processing: {
      label: "Processing",
      className: "bg-blue-100 text-blue-700",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700",
      icon: <AlertCircle className="h-3 w-3" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
      {status === "failed" && errorMessage && (
        <span className="text-xs text-red-600 max-w-[200px] truncate" title={errorMessage}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};

interface DocumentRowProps {
  doc: TaxDocumentMetadata;
}

const DocumentRow = ({
  doc,
  onSelect,
}: DocumentRowProps & { onSelect: (docId: string) => void }) => {
  const isProcessing = doc.status === "pending" || doc.status === "processing";
  const isClickable = doc.status === "completed";

  return (
    <tr
      className={`border-b border-slate-100 ${isClickable ? "cursor-pointer hover:bg-slate-50" : ""}`}
      onClick={() => isClickable && onSelect(doc.id)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-400" />
          <div>
            <p className="font-medium text-slate-900">{doc.original_filename}</p>
            <p className="text-xs text-slate-500">
              {doc.num_pages > 0 ? `${doc.num_pages} page${doc.num_pages !== 1 ? "s" : ""}` : "Processing..."}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {doc.status === "completed" ? (
          <DocTypeBadge docType={doc.doc_type} />
        ) : (
          <StatusBadge status={doc.status} errorMessage={doc.error_message} />
        )}
      </td>
      <td className="px-4 py-3">
        {doc.tax_year ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            {doc.tax_year}
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {doc.payer_name ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="truncate max-w-[200px]">{doc.payer_name}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {doc.taxpayer_name ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <User className="h-4 w-4 text-slate-400" />
            <span className="truncate max-w-[200px]">{doc.taxpayer_name}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {formatDate(doc.ingested_at)}
      </td>
    </tr>
  );
};

export const DocumentList = () => {
  const [taxYearFilter, setTaxYearFilter] = useState<number | null>(null);
  const [docTypeFilter, setDocTypeFilter] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: documents, isLoading, error, refetch } = useDocuments({
    tax_year: taxYearFilter ?? undefined,
    doc_type: docTypeFilter ?? undefined,
  });

  // Auto-refresh if any documents are pending or processing
  useEffect(() => {
    const hasProcessing = documents?.some(
      (doc) => doc.status === "pending" || doc.status === "processing",
    );

    if (hasProcessing) {
      const interval = setInterval(() => {
        refetch();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [documents, refetch]);

  const deleteAllMutation = useDeleteAllDocuments();

  const handleDeleteAll = async () => {
    try {
      await deleteAllMutation.mutateAsync();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete documents:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Upload Document
        </h2>
        <DocumentUpload />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Ingested Documents
              {documents && documents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({documents.length})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {documents && documents.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteAllMutation.isPending}
                  className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </button>
              )}
              <select
                value={taxYearFilter ?? ""}
                onChange={(e) =>
                  setTaxYearFilter(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => 2024 - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={docTypeFilter ?? ""}
                onChange={(e) => setDocTypeFilter(e.target.value || null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="w2">W-2</option>
                <option value="1099_int">1099-INT</option>
                <option value="1099_div">1099-DIV</option>
                <option value="1099_nec">1099-NEC</option>
                <option value="1099_misc">1099-MISC</option>
                <option value="1099_b">1099-B</option>
                <option value="1098">1098</option>
                <option value="brokerage_statement">Brokerage</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading documents...
          </div>
        )}

        {error && (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            Failed to load documents. Please try again.
          </div>
        )}

        {!isLoading && !error && documents && documents.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No documents found. Upload a PDF to get started.
          </div>
        )}

        {!isLoading && !error && documents && documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Type / Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Tax Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Payer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Taxpayer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Ingested
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    onSelect={setSelectedDocId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DocumentModal
        docId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Delete All Documents?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete all {documents?.length ?? 0} document
              {documents?.length !== 1 ? "s" : ""} and their files. This action
              cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteAllMutation.isPending}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

