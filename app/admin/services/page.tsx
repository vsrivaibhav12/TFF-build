import { listServiceCategories, listServices, listSubServices } from '@/lib/repositories/services';
import { listSopSteps } from '@/lib/repositories/sop';
import { Button } from '@/components/ui/button';
import ServiceDialog from './service-dialog';
import SubServiceDialog from './sub-service-dialog';
import SubServicePanel from './sub-service-panel';
import EmptyState from '@/components/sophistication/empty-state';
import { Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const [categories, services, subServices] = await Promise.all([
    listServiceCategories(),
    listServices(),
    listSubServices(),
  ]);

  // Pre-fetch SOP steps for every sub-service so the panel renders synchronously
  const sopByService: Record<string, any[]> = {};
  for (const ss of subServices as any[]) {
    sopByService[ss.id] = await listSopSteps(ss.id);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services catalogue</h1>
          <p className="text-zinc-500 mt-1">Define what your firm offers. Each sub-service can have an SOP — a checklist that’s copied into every task.</p>
        </div>
        <ServiceDialog categories={categories as any}>
          <Button data-testid="new-service">New service</Button>
        </ServiceDialog>
      </div>

      {services.length === 0 ? (
        <EmptyState
          title="No services defined yet"
          body="Start by creating a service (e.g. ‘GST Compliance’). Then add sub-services like ‘GSTR-3B’ inside it."
          icon={<Layers className="h-6 w-6 text-zinc-400" />}
        />
      ) : (
        <div className="space-y-6">
          {(categories as any[]).map((cat) => {
            const catServices = (services as any[]).filter((s) => s.category_id === cat.id);
            if (catServices.length === 0) return null;
            return (
              <section key={cat.id} className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">{cat.name}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {catServices.map((s: any) => {
                    const subs = (subServices as any[]).filter((ss) => ss.service_id === s.id);
                    return (
                      <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-zinc-900">{s.name}</div>
                            <div className="font-mono text-xs text-zinc-500 mt-0.5">{s.code}</div>
                            {s.description && <div className="text-xs text-zinc-500 mt-1">{s.description}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <ServiceDialog categories={categories as any} initial={s}>
                              <button className="text-xs text-teal-700 hover:underline">Edit</button>
                            </ServiceDialog>
                            <SubServiceDialog serviceId={s.id} serviceName={s.name}>
                              <button className="text-xs text-teal-700 hover:underline" data-testid={`add-sub-${s.code}`}>+ Sub-service</button>
                            </SubServiceDialog>
                          </div>
                        </div>
                        {subs.length === 0 ? (
                          <div className="mt-4 text-xs text-zinc-400 italic">No sub-services yet.</div>
                        ) : (
                          <ul className="mt-4 space-y-2">
                            {subs.map((ss: any) => (
                              <li key={ss.id}>
                                <SubServicePanel
                                  subService={ss}
                                  sopSteps={sopByService[ss.id] ?? []}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
