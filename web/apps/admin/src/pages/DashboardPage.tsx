import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type Order = { id: string; status: string; total: number; currency: string; createdAt: string; storeName?: string | null };
type Store = { id: string; tradeName: string; inventorySkuCount: number; onHandTotal: number; status: string };
type Product = { id: string; sku: string; name: string; price: number; currency: string; status: string };

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  PendingPayment: "bg-amber-100 text-amber-700",
  PaymentConfirmed: "bg-emerald-100 text-emerald-700",
  NotifiedToStore: "bg-indigo-100 text-indigo-700",
  InPreparation: "bg-purple-100 text-purple-700",
  Shipped: "bg-cyan-100 text-cyan-700",
  Delivered: "bg-emerald-200 text-emerald-800",
  Cancelled: "bg-rose-100 text-rose-700"
};

export function DashboardPage() {
  const orders = useQuery({
    queryKey: ["dashboard", "orders"],
    queryFn: async () => (await api.get<{ items: Order[] }>("/orders", { params: { size: 200 } })).data.items
  });
  const stores = useQuery({
    queryKey: ["dashboard", "stores"],
    queryFn: async () => (await api.get<Store[]>("/stores")).data
  });
  const products = useQuery({
    queryKey: ["dashboard", "products"],
    queryFn: async () => (await api.get<{ items: Product[]; total: number }>("/products", { params: { size: 5 } })).data
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayOrders = (orders.data ?? []).filter((o) => new Date(o.createdAt) >= today);
  const inFlight = (orders.data ?? []).filter((o) => ["PaymentConfirmed", "NotifiedToStore", "InPreparation", "Shipped"].includes(o.status));
  const revenueToday = todayOrders
    .filter((o) => ["Delivered", "Shipped", "InPreparation", "PaymentConfirmed", "NotifiedToStore"].includes(o.status))
    .reduce((s, o) => s + o.total, 0);
  const currency = (orders.data ?? [])[0]?.currency ?? "COP";
  const totalUnits = (stores.data ?? []).reduce((s, x) => s + x.onHandTotal, 0);
  const activeStores = (stores.data ?? []).filter((s) => s.status === "Active").length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card k="Pedidos hoy" v={todayOrders.length.toString()} />
        <Card k="En curso" v={inFlight.length.toString()} accent />
        <Card k="Tiendas activas" v={activeStores.toString()} sub={`${stores.data?.length ?? 0} totales`} />
        <Card k="Unidades en stock" v={totalUnits.toString()} sub={`${products.data?.total ?? 0} productos`} />
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <div className="text-xs text-slate-500">Ingresos hoy (estimados)</div>
        <div className="text-4xl font-bold text-emerald-700 mt-1">{fmt(revenueToday, currency)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Últimos pedidos</h3>
          {orders.isLoading && <p className="text-slate-500 text-sm">Cargando…</p>}
          {(orders.data ?? []).slice(0, 8).map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
              <div>
                <div className="font-medium">{o.storeName ?? "—"}</div>
                <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString("es-CO")}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor[o.status] ?? "bg-slate-100"}`}>{o.status}</span>
                <span className="font-semibold tabular-nums">{fmt(o.total, o.currency)}</span>
              </div>
            </div>
          ))}
          {orders.data?.length === 0 && <p className="text-slate-400 text-sm">Sin pedidos aún.</p>}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Tiendas</h3>
          {stores.isLoading && <p className="text-slate-500 text-sm">Cargando…</p>}
          {stores.data?.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
              <div>
                <div className="font-medium">{s.tradeName}</div>
                <div className="text-xs text-slate-500">{s.inventorySkuCount} SKUs · {s.onHandTotal} u</div>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200"}`}>{s.status}</span>
            </div>
          ))}
          {stores.data?.length === 0 && <p className="text-slate-400 text-sm">Sin tiendas.</p>}
        </div>
      </div>
    </div>
  );
}

function Card({ k, v, sub, accent }: { k: string; v: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl shadow p-5 ${accent ? "bg-emerald-600 text-white" : "bg-white"}`}>
      <p className={`text-xs uppercase ${accent ? "text-white/80" : "text-slate-500"}`}>{k}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ? "text-white" : "text-emerald-700"}`}>{v}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/70" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}
