const summaryRows = [
  {
    label: "Wages (1040 Line 1)",
    amount: "$142,500",
    source: "W-2 • Google",
  },
  {
    label: "Interest (Schedule B Line 1)",
    amount: "$925",
    source: "1099-INT • Chase",
  },
  {
    label: "Schedule C Net",
    amount: "$18,240",
    source: "Workpaper • Consulting",
  },
];

export const ReturnSummaryPanel = () => {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800">Return Snapshot</h2>
      <p className="text-xs text-slate-500">Drill into any line to request lineage.</p>
      <ul className="mt-4 space-y-3">
        {summaryRows.map((row) => (
          <li
            key={row.label}
            className="rounded-lg border border-slate-200 p-3 hover:border-primary"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">{row.label}</p>
            <p className="text-lg font-semibold text-slate-900">{row.amount}</p>
            <p className="text-xs text-slate-500">Source: {row.source}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

