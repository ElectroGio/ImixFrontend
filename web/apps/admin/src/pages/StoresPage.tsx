import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Modal } from "./ProductsPage";

type StoreSummary = {
  id: string;
  tradeName: string;
  legalName: string;
  taxId: string;
  city: string;
  district?: string | null;
  email: string;
  phone: string;
  status: string;
  managerUserId?: string | null;
  managerEmail?: string | null;
  inventorySkuCount: number;
  onHandTotal: number;
};

type StoreDetail = {
  id: string;
  tradeName: string;
  legalName: string;
  taxId: string;
  contactName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  district?: string | null;
  latitude: number;
  longitude: number;
  openingHours: string;
  coverageRadiusKm: number;
  logisticsCapacityPerDay: number;
  status: string;
  managerUserId?: string | null;
  managerEmail?: string | null;
};

const emptyForm = {
  legalName: "",
  tradeName: "",
  taxId: "",
  contactName: "",
  email: "",
  phone: "",
  addressLine: "",
  city: "",
  district: "",
  latitude: 4.65,
  longitude: -74.06,
  openingHours: "Lun-Sáb 8:00-20:00",
  coverageRadiusKm: 5.0,
  logisticsCapacityPerDay: 100
};
type FormState = typeof emptyForm;

const statusColor: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  PendingApproval: "bg-amber-100 text-amber-700",
  Inactive: "bg-slate-200 text-slate-600",
  Suspended: "bg-rose-100 text-rose-700"
};

export function StoresPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [assigning, setAssigning] = useState<StoreSummary | null>(null);
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["stores", search],
    queryFn: async () => (await api.get<StoreSummary[]>("/stores", { params: { search: search || undefined } })).data
  });

  const createMut = useMutation({
    mutationFn: async (f: FormState) => (await api.post("/stores", f)).data,
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["stores"] }); }
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormState }) => (await api.put(`/stores/${id}`, form)).data,
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["stores"] }); }
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.post(`/stores/${id}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores"] })
  });

  async function openEdit(id: string) {
    const { data } = await api.get<StoreDetail>(`/stores/${id}`);
    setEditing({
      id,
      form: {
        legalName: data.legalName,
        tradeName: data.tradeName,
        taxId: data.taxId,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        addressLine: data.addressLine,
        city: data.city,
        district: data.district ?? "",
        latitude: data.latitude,
        longitude: data.longitude,
        openingHours: data.openingHours,
        coverageRadiusKm: data.coverageRadiusKm,
        logisticsCapacityPerDay: data.logisticsCapacityPerDay
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Tiendas distribuidoras</h2>
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ciudad…"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-64"
          />
          <button
            onClick={() => setEditing({ id: null, form: emptyForm })}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >+ Nueva tienda</button>
        </div>
      </div>

      {list.isLoading && <p className="text-slate-500">Cargando…</p>}

      {!list.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.data?.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-12">Sin tiendas registradas.</div>
          )}
          {list.data?.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-lg">{s.tradeName}</div>
                  <div className="text-xs text-slate-500">{s.city}{s.district ? ` · ${s.district}` : ""}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[s.status] ?? "bg-slate-100"}`}>{s.status}</span>
              </div>
              <div className="text-sm text-slate-600 space-y-0.5">
                <div>📞 {s.phone}</div>
                <div>✉️ {s.email}</div>
                <div>🆔 NIT {s.taxId}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t">
                <div>
                  <div className="text-xs text-slate-500">SKUs</div>
                  <div className="font-bold">{s.inventorySkuCount}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Unidades</div>
                  <div className="font-bold">{s.onHandTotal}</div>
                </div>
              </div>
              <div className="pt-2 border-t text-xs">
                <div className="text-slate-500">Manager</div>
                <div className="font-medium">{s.managerEmail ?? <em className="text-slate-400">Sin asignar</em>}</div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => openEdit(s.id)} className="text-xs text-blue-700 hover:underline">Editar</button>
                <button onClick={() => setAssigning(s)} className="text-xs text-emerald-700 hover:underline">Manager</button>
                {s.status !== "Active" ? (
                  <button onClick={() => statusMut.mutate({ id: s.id, status: "active" })} className="text-xs text-emerald-700 hover:underline">Activar</button>
                ) : (
                  <button onClick={() => statusMut.mutate({ id: s.id, status: "inactive" })} className="text-xs text-rose-600 hover:underline">Desactivar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <StoreFormModal
          state={editing}
          isCreate={editing.id === null}
          saving={createMut.isPending || updateMut.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(form) => editing.id ? updateMut.mutate({ id: editing.id, form }) : createMut.mutate(form)}
        />
      )}

      {assigning && (
        <AssignManagerModal store={assigning} onClose={() => setAssigning(null)} onSaved={() => { setAssigning(null); qc.invalidateQueries({ queryKey: ["stores"] }); }} />
      )}
    </div>
  );
}

const inputCls = "w-full px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function StoreFormModal({ state, isCreate, saving, onClose, onSubmit }: {
  state: { id: string | null; form: FormState };
  isCreate: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(state.form);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={isCreate ? "Nueva tienda" : "Editar tienda"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Nombre comercial"><input value={form.tradeName} onChange={(e) => set("tradeName", e.target.value)} className={inputCls} /></Field>
        <Field label="Razón social"><input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} className={inputCls} /></Field>
        <Field label="NIT / Tax ID"><input value={form.taxId} disabled={!isCreate} onChange={(e) => set("taxId", e.target.value)} className={inputCls} /></Field>
        <Field label="Contacto"><input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputCls} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} /></Field>
        <Field label="Teléfono"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} /></Field>
        <Field label="Dirección" wide><input value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} className={inputCls} /></Field>
        <Field label="Ciudad"><input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} /></Field>
        <Field label="Localidad / Distrito"><input value={form.district} onChange={(e) => set("district", e.target.value)} className={inputCls} /></Field>
        <Field label="Latitud"><input type="number" step="0.000001" value={form.latitude} onChange={(e) => set("latitude", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Longitud"><input type="number" step="0.000001" value={form.longitude} onChange={(e) => set("longitude", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Horarios" wide><input value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} className={inputCls} /></Field>
        <Field label="Radio de cobertura (km)"><input type="number" step="0.1" value={form.coverageRadiusKm} onChange={(e) => set("coverageRadiusKm", Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Capacidad / día"><input type="number" value={form.logisticsCapacityPerDay} onChange={(e) => set("logisticsCapacityPerDay", Number(e.target.value))} className={inputCls} /></Field>
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

function AssignManagerModal({ store, onClose, onSaved }: { store: StoreSummary; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(unassign: boolean) {
    setSaving(true); setError(null);
    try {
      const body = unassign ? { userId: null, userEmail: null } : { userId: null, userEmail: email };
      await api.post(`/stores/${store.id}/assign-manager`, body);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message);
    } finally { setSaving(false); }
  }

  return (
    <Modal title={`Manager de ${store.tradeName}`} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-3">
        Asigna un usuario existente como administrador de esta tienda. Se le otorgará el rol <code className="bg-slate-100 px-1 rounded">store_manager</code>.
      </p>
      <div className="text-xs text-slate-500 mb-2">Manager actual: <strong>{store.managerEmail ?? "Sin asignar"}</strong></div>
      <Field label="Email del manager">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@imix.dev" className={inputCls} />
      </Field>
      {error && <p className="text-rose-600 text-xs mt-2">{error}</p>}
      <div className="mt-5 flex justify-between gap-2">
        <button onClick={() => submit(true)} disabled={saving} className="px-3 py-2 text-xs rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50">
          Quitar manager
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancelar</button>
          <button onClick={() => submit(false)} disabled={saving || !email} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50">
            {saving ? "Asignando…" : "Asignar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-slate-600 block mb-1">{label}</span>
      {children}
    </label>
  );
}
