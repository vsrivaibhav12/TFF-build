import { listServiceCategories, listServices, listSubServices } from '@/lib/repositories/services';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const [categories, services, subServices] = await Promise.all([
    listServiceCategories(),
    listServices(),
    listSubServices(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Services catalogue</h1>
        <p className="text-zinc-500 mt-1">{categories.length} categories · {services.length} services · {subServices.length} sub-services. Catalogue is firm-wide; assign to clients on the client detail page.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((c: any) => {
          const catServices = services.filter((s: any) => s.category_id === c.id);
          return (
            <div key={c.id} className="rounded-xl border border-zinc-200 p-6 bg-white">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-zinc-900">{c.name}</h3>
                <span className="text-xs text-zinc-500">order {c.display_order}</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">{c.description}</p>
              <div className="mt-4 space-y-3">
                {catServices.map((s: any) => {
                  const subs = subServices.filter((ss: any) => ss.service_id === s.id);
                  return (
                    <div key={s.id} className="rounded-lg border border-zinc-200 p-3 bg-zinc-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-zinc-900">{s.name} <span className="font-mono text-xs text-zinc-500">{s.code}</span></div>
                        <Badge variant="outline">{subs.length} sub</Badge>
                      </div>
                      {subs.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {subs.map((ss: any) => (
                            <li key={ss.id} className="text-xs flex items-center justify-between">
                              <span className="text-zinc-700">{ss.name}</span>
                              <Badge variant="teal">{ss.frequency}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
