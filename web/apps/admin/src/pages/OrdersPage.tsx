import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type OrderSummary = {
  id: string;
  number: string;
  status: string;
  channel: string;
  total: number;
  currency: string;
  createdAt: string;
  customerName?: string;
};

type Paged<T> = { items: T[]; page: number; size: number; total: number };

const statusColor: Record<string, string> = {
  Draft: "bg-slate-200 text-slate-700",
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Fulfilled: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-rose-100 text-rose-700",
  Refunded: "bg-purple-100 text-purple-700"
};

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const size = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", page, status],
    queryFn: async () => {
      try {
        const res = await api.get<Paged<OrderSummary>>("/orders", { params: { page, size, status: status || undefined } });
        return res.data;
      } catch (e: any) {
        if (e?.response?.status === 404 || e?.response?.status === 405) {
          return { items: [], page: 1, size, total: 0 } as Paged<OrderSummary>;
        }
        throw e;
      }
    }
  });

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Pedidos</h2>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="Pending">Pendientes</option>
          <option value="Confirmed">Confirmados</option>
          <option value="Paid">Pagados</option>
          <option value="Fulfilled">Entregados</option>
          <option value="Cancelled">Cancelados</option>
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Cargando…</p>}
      {isError && <p className="text-red-600 text-sm">Error: {(error as Error)?.message}</p>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">N°</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Canal</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Fecha</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aún no hay pedidos. Cuando un cliente complete una compra aparecerán aquí.
                  </td>
                </tr>
              )}
              {items.map((o) => (
                <tr key={o.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs">{o.number}</td>
                  <td className="p-3">{o.customerName ?? "—"}</td>
                  <td className="p-3 text-slate-500">{o.channel}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleString("es-CO")}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(o.total, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.total > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50 text-xs text-slate-600">
              <span>{data.total} pedido(s)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                >‹ Anterior</button>
                <span>Página {data.page} de {totalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                >Siguiente ›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
