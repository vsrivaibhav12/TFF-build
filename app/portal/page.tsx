export default function PortalDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="text-zinc-500 mt-1">Your compliance, documents and analytics in one place.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Open tasks', value: '—' },
          { label: 'Compliance status', value: '—' },
          { label: 'Last BizLens refresh', value: '—' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 p-6 bg-white">
            <div className="text-sm text-zinc-500">{m.label}</div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">{m.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-200 p-6 bg-zinc-50">
        <p className="text-sm text-zinc-500">
          Phase 0 foundation — detailed dashboards land in Phase 1 & Phase 2.
        </p>
      </div>
    </div>
  );
}
