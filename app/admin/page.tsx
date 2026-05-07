export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Firm Dashboard</h1>
      <p className="text-zinc-500">Phase 3 lands the full firm KPIs (MRR, throughput, compliance health).</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active clients', value: '—' },
          { label: 'Open tasks', value: '—' },
          { label: 'Overdue', value: '—' },
          { label: 'MRR (₹)', value: '—' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 p-6 bg-white">
            <div className="text-sm text-zinc-500">{m.label}</div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
