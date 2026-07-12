import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Modal } from "./ProductsPage";

type Store = { id: string; tradeName: string; city: string; status: string; managerEmail?: string | null };
type InventoryItem = {
  inventoryId: string;
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string | null;
  onHand: number;
  reserved: number;
  available: number;
  minStock: number;
  maxStock: number;
  price: number;
  currency: string;
};
type Movement = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  type: string;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  orderId?: string | null;
  note?: string | null;
  occurredAtUtc: string;
};
type Paged<T> = { items: T[]; page: number; size: number; total: number };

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export function InventoryPage() {
  const [storeId, setStoreId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<{ kind: "receive" | "adjust"; item: InventoryItem } | null>(null);
  const [showMovements, setShowMovements] = useState(false);
  const qc = useQueryClient();

  const stores = useQuery({
    queryKey: ["stores", "for-inventory"],
    queryFn: async () => (await api.get<Store[]>("/stores")).data
  });

  useEffect(() => {
    if (!storeId && stores.data?.length) setStoreId(stores.data[0].id);
  }, [stores.data, storeId]);

  const inv = useQuery({
    enabled: !!storeId,
    queryKey: ["inventory", storeId, search],
    queryFn: async () => (await api.get<InventoryItem[]>("/inventory", { params: { storeId, search: search || undefined } })).data
  });

  const movs = useQuery({
    enabled: !!storeId && showMovements,
    queryKey: ["inventory", storeId, "movements"],
    queryFn: async () => (await api.get<Paged<Movement>>("/inventory/movements", { params: { storeId, page: 1, size: 50 } })).data
  });

  const receiveMut = useMutation({
    mutationFn: async (body: { storeId: string; productId: string; quantity: number; note?: string }) =>
      (await api.post("/inventory/receive", body)).data,
    onSuccess: () => { setAction(null); qc.invalidateQueries({ queryKey: ["inventory", storeId] }); }
  });
  const adjustMut = useMutation({
    mutationFn: async (body: { storeId: string; productId: string; delta: number; reason: string }) =>
      (await api.post("/inventory/adjust", body)).data,
    onSuccess: () => { setAction(null); qc.invalidateQueries({ queryKey: ["inventory", storeId] }); }
  });

  const currentStore = stores.data?.find((s) => s.id === storeId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm min-w-64">
            <option value="">— Selecciona una tienda —</option>
            {stores.data?.map((s) => (
              <option key={s.id} value={s.id}>{s.tradeName} ({s.city})</option>
            ))}
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-56"
          />
          <button
            onClick={() => setShowMovements(true)}
            disabled={!storeId}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
          >Movimientos</button>
        </div>
      </div>

      {currentStore && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-sm flex items-center gap-3">
          <strong>{currentStore.tradeName}</strong>
          <span className="text-slate-500">·</span>
          <span>{currentStore.city}</span>
          {currentStore.managerEmail && <><span className="text-slate-500">·</span><span>Manager: <strong>{currentStore.managerEmail}</strong></span></>}
        </div>
      )}

      {!storeId && <p className="text-slate-500">Selecciona una tienda para ver su inventario.</p>}
      {storeId && inv.isLoading && <p className="text-slate-500">Cargando…</p>}

      {storeId && !inv.isLoading && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-10 p-2"></th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Producto</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-right p-3">Reserv.</th>
                <th className="text-right p-3">Disp.</th>
                <th className="text-right p-3">Min/Max</th>
                <th className="text-right p-3 w-40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inv.data?.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Sin productos.</td></tr>
              )}
              {inv.data?.map((i) => {
                const low = i.onHand < i.minStock;
                return (
                  <tr key={i.productId} className={`border-t ${low ? "bg-amber-50/40" : "hover:bg-slate-50"}`}>
                    <td className="p-2">
                      {i.imageUrl
                        ? <img src={i.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                        : <div className="w-8 h-8 rounded bg-slate-100" />}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{i.sku}</td>
                    <td className="p-3 font-medium">
                      {i.name}
                      <div className="text-xs text-slate-500">{fmt(i.price, i.currency)}</div>
                    </td>
                    <td className={`p-3 text-right tabular-nums font-bold ${low ? "text-amber-700" : ""}`}>{i.onHand}</td>
                    <td className="p-3 text-right tabular-nums text-slate-500">{i.reserved}</td>
                    <td className="p-3 text-right tabular-nums">{i.available}</td>
                    <td className="p-3 text-right text-xs text-slate-500">{i.minStock}/{i.maxStock}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => setAction({ kind: "receive", item: i })} className="text-xs text-emerald-700 hover:underline mr-2">+ Recibir</button>
                      <button onClick={() => setAction({ kind: "adjust", item: i })} className="text-xs text-blue-700 hover:underline">Ajustar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {action && (
        <StockActionModal
          kind={action.kind}
          item={action.item}
          storeId={storeId}
          saving={receiveMut.isPending || adjustMut.isPending}
          onClose={() => setAction(null)}
          onSubmit={(values) => {
            if (action.kind === "receive") {
              receiveMut.mutate({ storeId, productId: action.item.productId, quantity: values.qty, note: values.note });
            } else {
              adjustMut.mutate({ storeId, productId: action.item.productId, delta: values.qty, reason: values.note });
            }
          }}
        />
      )}

      {showMovements && (
        <Modal title="Movimientos de inventario" onClose={() => setShowMovements(false)} wide>
          {movs.isLoading && <p>Cargando…</p>}
          {movs.data && (
            <div className="bg-slate-50 rounded-lg overflow-hidden border max-h-[70vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Antes → Ahora</th>
                    <th className="text-left p-2">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {movs.data.items.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-slate-400">Sin movimientos.</td></tr>
                  )}
                  {movs.data.items.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2 text-slate-500">{new Date(m.occurredAtUtc).toLocaleString("es-CO")}</td>
                      <td className="p-2 font-mono">{m.productSku}</td>
                      <td className="p-2">{m.productName}</td>
                      <td className="p-2"><span className={`px-1.5 py-0.5 rounded ${movColor(m.type)}`}>{m.type}</span></td>
                      <td className="p-2 text-right tabular-nums">{m.quantity}</td>
                      <td className="p-2 text-right tabular-nums text-slate-500">{m.previousOnHand} → {m.newOnHand}</td>
                      <td className="p-2 text-slate-500">{m.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function movColor(t: string) {
  switch (t) {
    case "In": return "bg-emerald-100 text-emerald-700";
    case "OutSale": return "bg-blue-100 text-blue-700";
    case "Reserve": return "bg-amber-100 text-amber-700";
    case "Release": return "bg-slate-100 text-slate-600";
    case "Adjustment": return "bg-purple-100 text-purple-700";
    case "Loss": case "Expired": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function StockActionModal({
  kind, item, storeId, saving, onClose, onSubmit
}: {
  kind: "receive" | "adjust";
  item: InventoryItem;
  storeId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: { qty: number; note: string }) => void;
}) {
  const [qty, setQty] = useState<number>(kind === "receive" ? 1 : 0);
  const [note, setNote] = useState("");
  const title = kind === "receive" ? "Recibir stock" : "Ajustar stock";
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-3">
        <strong>{item.name}</strong> <span className="text-slate-400">·</span> SKU {item.sku} <span className="text-slate-400">·</span> Stock actual: <strong>{item.onHand}</strong>
      </p>
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="text-xs font-medium text-slate-600 block mb-1">
            {kind === "receive" ? "Unidades a recibir" : "Delta (puede ser negativo)"}
          </span>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full px-2 py-1.5 rounded border border-slate-300"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 block mb-1">{kind === "receive" ? "Nota (opcional)" : "Razón (obligatoria)"}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={kind === "receive" ? "Ej: Orden de compra #123" : "Ej: Conteo físico"}
            className="w-full px-2 py-1.5 rounded border border-slate-300"
          />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancelar</button>
        <button
          onClick={() => onSubmit({ qty, note })}
          disabled={saving || qty === 0 || !storeId || (kind === "adjust" && !note.trim())}
          className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
