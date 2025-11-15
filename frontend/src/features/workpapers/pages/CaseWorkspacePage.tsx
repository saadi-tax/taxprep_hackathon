import { useParams } from "react-router-dom";

import { ThreePanelLayout } from "../../../components/layout/ThreePanelLayout";
import { DocumentList } from "../../documents/components/DocumentList";
import { ConversationPanel } from "../components/ConversationPanel";
import { ReturnSummaryPanel } from "../components/ReturnSummaryPanel";

export const CaseWorkspacePage = () => {
  const { caseId } = useParams();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Workspace</h1>
        <p className="text-sm text-slate-500">
          Case ID <span className="font-mono text-slate-700">{caseId}</span>
        </p>
      </div>
      <ThreePanelLayout
        left={<DocumentList />}
        center={<ConversationPanel />}
        right={<ReturnSummaryPanel />}
      />
    </section>
  );
};

