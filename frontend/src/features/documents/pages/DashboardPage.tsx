import { DocumentList } from "../../../components/documents/DocumentList";

export const DashboardPage = () => {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Tax Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload and manage tax documents. Documents are automatically
          classified and metadata is extracted.
        </p>
      </header>
      <DocumentList />
    </section>
  );
};

