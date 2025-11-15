type DocumentSummary = {
  id: string;
  label: string;
  type: "W2" | "1099" | "Receipt" | "Other";
  confidence: number;
};

const documents: DocumentSummary[] = [
  { id: "doc-1", label: "W-2 • Google Inc.", type: "W2", confidence: 0.99 },
  { id: "doc-2", label: "1099-INT • Chase Bank", type: "1099", confidence: 0.93 },
  { id: "doc-3", label: "Schedule C Receipts", type: "Receipt", confidence: 0.78 },
];

export const DocumentList = () => {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800">Documents</h2>
      <p className="text-xs text-slate-500">Organized by inferred taxonomy.</p>
      <ul className="mt-4 space-y-2">
        {documents.map((document) => (
          <li
            key={document.id}
            className="rounded-lg border border-slate-200 px-3 py-2 hover:border-primary"
          >
            <p className="text-sm font-medium text-slate-800">{document.label}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{document.type}</span>
              <span>Confidence {(document.confidence * 100).toFixed(0)}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

