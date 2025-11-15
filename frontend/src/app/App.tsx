import { Navigate, Route, Routes } from "react-router-dom";

import { WorkspaceShell } from "../components/layout/WorkspaceShell";
import { CaseWorkspacePage } from "../features/workpapers/pages/CaseWorkspacePage";
import { DashboardPage } from "../features/documents/pages/DashboardPage";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<WorkspaceShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="case/:caseId" element={<CaseWorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

