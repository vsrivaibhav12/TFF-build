import { redirect } from 'next/navigation';

export default function PortalBizLensPlaceholder() {
  // Phase 2 ships the full BizLens embed at /portal/bizlens.
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BizLens analytics</h1>
        <p className="text-zinc-500 mt-1">Embedded BizLens analytics ships in Phase 2.</p>
      </div>
      <div className="rounded-xl border border-zinc-200 p-8 bg-zinc-50">
        <p className="text-sm text-zinc-700">Coming soon: live profitability, working capital and cash flow visualisations refreshed monthly.</p>
      </div>
    </div>
  );
}
