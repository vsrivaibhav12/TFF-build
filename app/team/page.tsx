export default function TeamWorkspace() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
      <p className="text-zinc-500">Phase 1 lands the full task workflow, compliance trackers and client roster.</p>
      <div className="rounded-xl border border-zinc-200 p-6 bg-white">
        <div className="text-sm font-medium text-zinc-700">Phase 0 — foundation ready</div>
        <p className="text-sm text-zinc-500 mt-2">
          Auth, RLS, design system, schema deployed. Next: Phase 1 (clients, services, tasks, compliance).
        </p>
      </div>
    </div>
  );
}
