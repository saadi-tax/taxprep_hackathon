import { ReactNode } from "react";

type ThreePanelLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export const ThreePanelLayout = ({ left, center, right }: ThreePanelLayoutProps) => {
  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {left}
      </aside>
      <section className="col-span-5 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {center}
      </section>
      <section className="col-span-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {right}
      </section>
    </div>
  );
};

