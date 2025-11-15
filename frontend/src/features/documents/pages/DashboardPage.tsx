import { Link } from "react-router-dom";

const sampleCases = [
  {
    id: "demo",
    taxpayer: "Jordan Rivera",
    status: "Awaiting documents",
    documents: 12,
    updatedAt: "2025-11-14",
  },
  {
    id: "complex",
    taxpayer: "Akari Patel",
    status: "Extracted",
    documents: 27,
    updatedAt: "2025-11-13",
  },
];

export const DashboardPage = () => {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tax Cases</h1>
          <p className="text-sm text-slate-500">
            Track document ingestion, extraction progress, and return readiness.
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm">
          New case
        </button>
      </header>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Taxpayer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Documents</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sampleCases.map((taxCase) => (
              <tr key={taxCase.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium">{taxCase.taxpayer}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                    {taxCase.status}
                  </span>
                </td>
                <td className="px-4 py-3">{taxCase.documents}</td>
                <td className="px-4 py-3">{taxCase.updatedAt}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/case/${taxCase.id}`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Open workspace
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

