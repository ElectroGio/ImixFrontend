import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Modal } from "./ProductsPage";

type OrderSummary = {
  id: string;
  number: string;
  status: string;
  channel: string;
  total: number;
  currency: string;
  createdAt: string;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  itemsCount: number;
};

type OrderDetail = {
  id: string;
  number: string;
  status: string;
  channel: string;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  storeName?: string | null;
  storeCity?: string | null;
  storePhone?: string | null;
  items: { id: string; sku: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  history: { status: string; changedAt: string; note?: string | null }[];
};

type Paged<T> = { items: T[]; page: number; size: number; total: number };

const statusColor: Record<string, string> = {
  Created: "bg-slate-200 text-slate-700",
  PendingPayment: "bg-amber-100 text-amber-700",
  InventoryReserved: "bg-blue-100 text-blue-700",
  PaymentInProgress: "bg-amber-100 text-amber-700",
  PaymentConfirmed: "bg-emerald-100 text-emerald-700",
  NotifiedToStore: "bg-indigo-100 text-indigo-700",
  InPreparation: "bg-purple-100 text-purple-700",
  Shipped: "bg-cyan-100 text-cyan-700",
  Delivered: "bg-emerald-200 text-emerald-800",
  Cancelled: "bg-rose-100 text-rose-700",
  Rejected: "bg-rose-100 text-rose-700",
  ReservationExpired: "bg-slate-200 text-slate-500",
  Refunded: "bg-purple-100 text-purple-700"
};

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const size = 20;

  const list = useQuery({
    queryKey: ["orders", page, status, search],
    queryFn: async () =>
      (await api.get<Paged<OrderSummary>>("/orders", {
        params: { page, size, status: status || undefined, search: search || undefined }
      })).data
  });

  const items = list.data?.items ?? [];
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.size)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">Pedidos</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cliente, teléfono, #…"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-56"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="PendingPayment">Pendiente de pago</option>
            <option value="InventoryReserved">Inv. reservado</option>
            <option value="PaymentConfirmed">Pago confirmado</option>
            <option value="NotifiedToStore">Notificado a tienda</option>
            <option value="InPreparation">En preparación</option>
            <option value="Shipped">Enviado</option>
            <option value="Delivered">Entregado</option>
            <option value="Cancelled">Cancelado</option>
            <option value="Rejected">Rechazado</option>
          </select>
        </div>
      </div>

      {list.isLoading && <p className="text-slate-500">Cargando…</p>}
      {list.isError && <p className="text-red-600 text-sm">Error: {(list.error as Error)?.message}</p>}

      {!list.isLoading && !list.isError && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">N°</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Tienda</th>
                <th className="text-left p-3">Canal</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Fecha</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3">Items</th>
                <th className="text-right p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Aún no hay pedidos. Cuando un cliente complete una compra aparecerán aquí.
                  </td>
                </tr>
              )}
              {items.map((o) => (
                <tr key={o.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs">{o.number}</td>
                  <td className="p-3">
                    <div className="font-medium">{o.customerName ?? "—"}</div>
                    {o.customerPhone && <div className="text-xs text-slate-500">{o.customerPhone}</div>}
                  </td>
                  <td className="p-3 text-slate-600">{o.storeName ?? <em className="text-slate-400">Sin asignar</em>}</td>
                  <td className="p-3 text-slate-500">{o.channel}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleString("es-CO")}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(o.total, o.currency)}</td>
                  <td className="p-3 text-right tabular-nums text-slate-500">{o.itemsCount}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setDetailId(o.id)} className="text-xs text-emerald-700 hover:underline">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {list.data && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50 text-xs text-slate-600">
              <span>{list.data.total} pedido(s)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">‹</button>
                <span>Página {list.data.page} de {totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </div>
      )}

      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await api.get<OrderDetail>(`/orders/${orderId}`)).data
  });

  const transitionMut = useMutation({
    mutationFn: async ({ action, note }: { action: string; note?: string }) =>
      (await api.post(`/orders/${orderId}/transition`, { action, note })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const cancelMut = useMutation({
    mutationFn: async (reason: string) => (await api.post(`/orders/${orderId}/cancel`, { reason })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const d = q.data;
  const actions = d ? nextActions(d.status) : [];
  const canCancel = d && ["Created", "PendingPayment", "InventoryReserved", "PaymentInProgress", "NotifiedToStore", "InPreparation"].includes(d.status);

  return (
    <Modal title={d ? `Pedido ${d.number}` : "Pedido"} onClose={onClose} wide>
      {q.isLoading && <p>Cargando…</p>}
      {q.isError && <p className="text-rose-600 text-sm">{(q.error as Error)?.message}</p>}
      {d && (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <Card title="Cliente">
              <div className="font-medium">{d.customerName ?? "—"}</div>
              <div className="text-xs text-slate-500">{d.customerEmail}</div>
              <div className="text-xs text-slate-500">{d.customerPhone}</div>
            </Card>
            <Card title="Tienda">
              <div className="font-medium">{d.storeName ?? <em className="text-slate-400">Sin asignar</em>}</div>
              <div className="text-xs text-slate-500">{d.storeCity}</div>
              <div className="text-xs text-slate-500">{d.storePhone}</div>
            </Card>
            <Card title="Resumen">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(d.subtotal, d.currency)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{fmt(d.total, d.currency)}</span></div>
              <div className="text-xs text-slate-500 mt-1">
                Canal: {d.channel} · Estado: <span className={`px-1.5 py-0.5 rounded ${statusColor[d.status] ?? "bg-slate-100"}`}>{d.status}</span>
              </div>
            </Card>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Líneas ({d.items.length})</h4>
            <div className="bg-slate-50 rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-right p-2">Cant.</th>
                    <th className="text-right p-2">Precio</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="p-2 font-mono">{i.sku}</td>
                      <td className="p-2">{i.name}</td>
                      <td className="p-2 text-right tabular-nums">{i.quantity}</td>
                      <td className="p-2 text-right tabular-nums">{fmt(i.unitPrice, d.currency)}</td>
                      <td className="p-2 text-right tabular-nums font-medium">{fmt(i.lineTotal, d.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Historial</h4>
            <ol className="border-l-2 border-emerald-200 pl-4 space-y-2">
              {d.history.map((h, i) => (
                <li key={i} className="text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className={`px-1.5 py-0.5 rounded ${statusColor[h.status] ?? "bg-slate-100"}`}>{h.status}</span>
                    <span className="text-slate-500">{new Date(h.changedAt).toLocaleString("es-CO")}</span>
                  </div>
                  {h.note && <div className="text-slate-600 italic mt-0.5">{h.note}</div>}
                </li>
              ))}
            </ol>
          </div>

          {(actions.length > 0 || canCancel) && (
            <div className="pt-3 border-t flex gap-2 flex-wrap">
              {actions.map((a) => (
                <button
                  key={a.action}
                  onClick={() => transitionMut.mutate({ action: a.action })}
                  disabled={transitionMut.isPending}
                  className={`px-3 py-1.5 text-xs rounded-lg text-white ${a.color} disabled:opacity-50`}
                >{a.label}</button>
              ))}
              {canCancel && (
                <button
                  onClick={() => { const r = prompt("Razón de cancelación:"); if (r) cancelMut.mutate(r); }}
                  disabled={cancelMut.isPending}
                  className="px-3 py-1.5 text-xs rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >Cancelar pedido</button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function nextActions(status: string): { action: string; label: string; color: string }[] {
  switch (status) {
    case "PaymentConfirmed":
      return [{ action: "notify", label: "→ Notificar tienda", color: "bg-indigo-600 hover:bg-indigo-700" }];
    case "NotifiedToStore":
      return [
        { action: "prepare", label: "→ En preparación", color: "bg-purple-600 hover:bg-purple-700" },
        { action: "reject", label: "Rechazar", color: "bg-rose-600 hover:bg-rose-700" }
      ];
    case "InPreparation":
      return [{ action: "ship", label: "→ Enviar", color: "bg-cyan-600 hover:bg-cyan-700" }];
    case "Shipped":
      return [{ action: "deliver", label: "→ Marcar entregado", color: "bg-emerald-600 hover:bg-emerald-700" }];
    case "InventoryReserved":
    case "PendingPayment":
      return [{ action: "confirm-payment", label: "Confirmar pago (manual)", color: "bg-emerald-600 hover:bg-emerald-700" }];
    default:
      return [];
  }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg border p-3">
      <div className="text-xs text-slate-500 mb-1">{title}</div>
      {children}
    </div>
  );
}
