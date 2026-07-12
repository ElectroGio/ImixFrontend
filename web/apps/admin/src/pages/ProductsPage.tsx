import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type ProductSummary = {
  id: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  isFeatured: boolean;
  imageUrl?: string | null;
};

type ProductDetail = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryId: string;
  price: number;
  promoPrice?: number | null;
  cost: number;
  currency: string;
  unit: string;
  minStock: number;
  maxStock: number;
  status: string;
  isFeatured: boolean;
  isRecommended: boolean;
  totalOnHand: number;
  totalReserved: number;
  unitsSold: number;
  revenueTotal: number;
};

type ProductMovement = {
  id: string;
  storeId: string;
  storeName: string;
  type: string;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  orderId?: string | null;
  note?: string | null;
  occurredAtUtc: string;
};

type Paged<T> = { items: T[]; page: number; size: number; total: number };

const DEFAULT_CATEGORY = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  imageUrl: "",
  categoryId: DEFAULT_CATEGORY,
  basePrice: 0,
  promoPrice: "" as number | "",
  cost: 0,
  currency: "COP",
  unit: "unit",
  minStock: 0,
  maxStock: 100,
  status: "Active",
  isFeatured: false
};

type FormState = typeof emptyForm;

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const size = 20;
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["products", page, search],
    queryFn: async () =>
      (await api.get<Paged<ProductSummary>>("/products", { params: { page, size, search: search || undefined } })).data
  });

  const createMut = useMutation({
    mutationFn: async (f: FormState) => (await api.post("/products", {
      sku: f.sku, name: f.name, categoryId: f.categoryId,
      basePrice: Number(f.basePrice), cost: Number(f.cost), currency: f.currency,
      unit: f.unit, minStock: Number(f.minStock), maxStock: Number(f.maxStock)
    })).data,
    onSuccess: async (created: any) => {
      // Si hay descripción/imagen/destacado los completamos vía PUT
      if (editing) {
        const f = editing.form;
        if (f.description || f.imageUrl || f.promoPrice !== "" || f.isFeatured || f.status !== "Active") {
          await api.put(`/products/${created.id}`, buildUpdateBody(f));
        }
      }
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormState }) =>
      (await api.put(`/products/${id}`, buildUpdateBody(form))).data,
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["products"] }); }
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] })
  });

  const items = list.data?.items ?? [];
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.size)) : 1;

  async function openEdit(id: string) {
    const { data } = await api.get<ProductDetail>(`/products/${id}`);
    setEditing({
      id,
      form: {
        sku: data.sku,
        name: data.name,
        description: data.description ?? "",
        imageUrl: data.imageUrl ?? "",
        categoryId: data.categoryId,
        basePrice: data.price,
        promoPrice: data.promoPrice ?? "",
        cost: data.cost,
        currency: data.currency,
        unit: data.unit,
        minStock: data.minStock,
        maxStock: data.maxStock,
        status: data.status,
        isFeatured: data.isFeatured
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Productos</h2>
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar…"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-64"
          />
          <button
            onClick={() => setEditing({ id: null, form: emptyForm })}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >+ Nuevo</button>
        </div>
      </div>

      {list.isLoading && <p className="text-slate-500">Cargando…</p>}
      {list.isError && <p className="text-red-600 text-sm">Error: {(list.error as Error)?.message}</p>}

      {!list.isLoading && !list.isError && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-12 p-2"></th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Precio</th>
                <th className="text-right p-3 w-40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Sin productos.</td></tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="p-2">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs">—</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="p-3 font-medium">
                    {p.name}
                    {p.isFeatured && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">★</span>}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{fmt(p.price, p.currency)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setDetailId(p.id)} className="text-xs text-emerald-700 hover:underline mr-2">Detalle</button>
                    <button onClick={() => openEdit(p.id)} className="text-xs text-blue-700 hover:underline mr-2">Editar</button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${p.name}"?`)) deleteMut.mutate(p.id); }}
                      className="text-xs text-rose-600 hover:underline"
                    >Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {list.data && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50 text-xs text-slate-600">
              <span>{list.data.total} producto(s)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">‹</button>
                <span>Página {list.data.page} de {totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </div>
      )}

      {editing && (
        <ProductFormModal
          state={editing}
          isCreate={editing.id === null}
          saving={createMut.isPending || updateMut.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(form) => editing.id ? updateMut.mutate({ id: editing.id, form }) : createMut.mutate(form)}
        />
      )}

      {detailId && (
        <ProductDetailModal productId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

function buildUpdateBody(f: FormState) {
  return {
    name: f.name,
    description: f.description || null,
    imageUrl: f.imageUrl || null,
    categoryId: f.categoryId,
    basePrice: Number(f.basePrice),
    promoPrice: f.promoPrice === "" ? null : Number(f.promoPrice),
    cost: Number(f.cost),
    currency: f.currency,
    unit: f.unit,
    minStock: Number(f.minStock),
    maxStock: Number(f.maxStock),
    status: f.status,
    isFeatured: f.isFeatured
  };
}

function ProductFormModal({
  state, isCreate, saving, onClose, onSubmit
}: {
  state: { id: string | null; form: FormState };
  isCreate: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(state.form);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Modal title={isCreate ? "Nuevo producto" : "Editar producto"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="SKU"><input value={form.sku} disabled={!isCreate} onChange={(e) => set("sku", e.target.value.toUpperCase())} className={inputCls} /></Field>
        <Field label="Estado">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            <option value="Active">Activo</option>
            <option value="Inactive">Inactivo</option>
            <option value="Discontinued">Descontinuado</option>
          </select>
        </Field>
        <Field label="Nombre" wide><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
        <Field label="Descripción" wide>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="URL imagen" wide>
          <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
        {form.imageUrl && (
          <div className="col-span-2"><img src={form.imageUrl} alt="" className="h-24 rounded object-cover border" /></div>
        )}
        <Field label="Precio base"><input type="number" value={form.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Precio promo (opcional)"><input type="number" value={form.promoPrice} onChange={(e) => set("promoPrice", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Costo"><input type="number" value={form.cost} onChange={(e) => set("cost", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Moneda"><input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} maxLength={3} className={inputCls} /></Field>
        <Field label="Unidad"><input value={form.unit} onChange={(e) => set("unit", e.target.value)} className={inputCls} /></Field>
        <Field label="Mín. stock"><input type="number" value={form.minStock} onChange={(e) => set("minStock", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Máx. stock"><input type="number" value={form.maxStock} onChange={(e) => set("maxStock", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Destacado">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
            <span className="text-xs text-slate-600">Mostrar como destacado</span>
          </label>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancelar</button>
        <button onClick={() => onSubmit(form)} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

function ProductDetailModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => (await api.get<ProductDetail>(`/products/${productId}`)).data
  });
  const movs = useQuery({
    queryKey: ["product", productId, "movements"],
    queryFn: async () => (await api.get<Paged<ProductMovement>>(`/products/${productId}/movements`, { params: { page: 1, size: 50 } })).data
  });

  return (
    <Modal title="Detalle de producto" onClose={onClose} wide>
      {detail.isLoading && <p>Cargando…</p>}
      {detail.data && (
        <div className="space-y-4">
          <div className="flex gap-4">
            {detail.data.imageUrl
              ? <img src={detail.data.imageUrl} alt="" className="w-32 h-32 rounded-lg object-cover border" />
              : <div className="w-32 h-32 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">Sin imagen</div>}
            <div className="flex-1">
              <div className="text-xs font-mono text-slate-500">{detail.data.sku}</div>
              <div className="text-xl font-bold">{detail.data.name}</div>
              <p className="text-sm text-slate-600 mt-1">{detail.data.description ?? <em className="text-slate-400">Sin descripción</em>}</p>
              <div className="mt-2 text-sm">
                <span className="font-semibold">{fmt(detail.data.price, detail.data.currency)}</span>
                {detail.data.promoPrice && <span className="ml-2 text-emerald-700">Promo: {fmt(detail.data.promoPrice, detail.data.currency)}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Stat label="En stock" value={detail.data.totalOnHand.toString()} />
            <Stat label="Reservado" value={detail.data.totalReserved.toString()} />
            <Stat label="Unidades vendidas" value={detail.data.unitsSold.toString()} />
            <Stat label="Ingresos est." value={fmt(detail.data.revenueTotal, detail.data.currency)} />
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Distribución y movimientos</h4>
            <div className="bg-slate-50 rounded-lg overflow-hidden border max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Tienda</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Antes → Ahora</th>
                    <th className="text-left p-2">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {movs.data?.items.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-slate-400">Sin movimientos.</td></tr>
                  )}
                  {movs.data?.items.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2 text-slate-500">{new Date(m.occurredAtUtc).toLocaleString("es-CO")}</td>
                      <td className="p-2">{m.storeName}</td>
                      <td className="p-2"><span className={`px-1.5 py-0.5 rounded ${movColor(m.type)}`}>{m.type}</span></td>
                      <td className="p-2 text-right tabular-nums">{m.quantity}</td>
                      <td className="p-2 text-right tabular-nums text-slate-500">{m.previousOnHand} → {m.newOnHand}</td>
                      <td className="p-2 text-slate-500">{m.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

const inputCls = "w-full px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-slate-600 block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function movColor(t: string) {
  switch (t) {
    case "In": case "Receive": return "bg-emerald-100 text-emerald-700";
    case "OutSale": return "bg-blue-100 text-blue-700";
    case "Reserve": return "bg-amber-100 text-amber-700";
    case "Release": return "bg-slate-100 text-slate-600";
    case "Adjustment": return "bg-purple-100 text-purple-700";
    case "Loss": case "Expired": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-4xl" : "max-w-2xl"} p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
