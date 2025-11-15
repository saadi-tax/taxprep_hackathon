import { Link, Outlet, useLocation } from "react-router-dom";

import { useApiHealth } from "../../lib/hooks/useApiHealth";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Workspace", path: "/case/demo" },
];

export const WorkspaceShell = () => {
  const location = useLocation();
  const { data: healthStatus } = useApiHealth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-primary">TaxGPT</span>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-500">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-md px-3 py-2 transition ${
                    active ? "bg-primary text-white" : "hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          API: {healthStatus?.status ?? "checking"}
        </span>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

