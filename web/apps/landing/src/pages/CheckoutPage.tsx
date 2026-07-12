import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { fmt, useCart } from "../lib/cart";

type CheckoutForm = {
    fullName: string;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
    district: string;
    latitude: number;
    longitude: number;
    consent: boolean;
};

const initial: CheckoutForm = {
    fullName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "Bogotá",
    district: "",
    latitude: 4.65,
    longitude: -74.06,
    consent: false
};

export function CheckoutPage() {
    const items = useCart((s) => s.items);
    const subtotal = useCart((s) => s.subtotal());
    const clear = useCart((s) => s.clear);
    const currency = items[0]?.currency ?? "COP";
    const nav = useNavigate();
    const [form, setForm] = useState<CheckoutForm>(initial);
    const set = <K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) => setForm((p) => ({ ...p, [k]: v }));

    const mut = useMutation({
        mutationFn: async () => (await api.post<{ orderId: string; storeId: string; total: number; currency: string; status: string }>("/public/checkout", {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            addressLine: form.addressLine,
            city: form.city,
            district: form.district || null,
            latitude: form.latitude,
            longitude: form.longitude,
            channel: "web",
            currency,
            preferredStoreId: null,
            dataProcessingConsent: form.consent,
            lines: items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        })).data,
        onSuccess: (res) => {
            clear();
            nav(`/gracias?order=${res.orderId}`);
        }
    });

    function useMyLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            set("latitude", Number(pos.coords.latitude.toFixed(6)));
            set("longitude", Number(pos.coords.longitude.toFixed(6)));
        });
    }

    if (items.length === 0) {
        nav("/carrito", { replace: true });
        return null;
    }

    const errorMsg = mut.error
        ? ((mut.error as any)?.response?.data?.message ?? (mut.error as any)?.response?.data?.detail ?? (mut.error as any)?.message ?? "Error al procesar el pedido")
        : null;

    return (
        <section className="max-w-5xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>
            <form
                onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
                className="grid md:grid-cols-3 gap-6"
            >
                <div className="md:col-span-2 bg-white rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Tus datos</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Nombre completo" wide>
                            <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={cls} />
                        </Field>
                        <Field label="Email">
                            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={cls} />
                        </Field>
                        <Field label="Teléfono">
                            <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="3001234567" className={cls} />
                        </Field>
                    </div>

                    <h2 className="font-semibold text-lg pt-4">Dirección de entrega</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Dirección" wide>
                            <input required value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Cl. 100 # 15-30 Apto 501" className={cls} />
                        </Field>
                        <Field label="Ciudad">
                            <input required value={form.city} onChange={(e) => set("city", e.target.value)} className={cls} />
                        </Field>
                        <Field label="Localidad / Barrio (opcional)">
                            <input value={form.district} onChange={(e) => set("district", e.target.value)} className={cls} />
                        </Field>
                        <Field label="Latitud">
                            <input required type="number" step="0.000001" value={form.latitude} onChange={(e) => set("latitude", Number(e.target.value))} className={cls} />
                        </Field>
                        <Field label="Longitud">
                            <input required type="number" step="0.000001" value={form.longitude} onChange={(e) => set("longitude", Number(e.target.value))} className={cls} />
                        </Field>
                    </div>
                    <button type="button" onClick={useMyLocation} className="text-xs text-imix-leaf-700 hover:underline">
                        📍 Usar mi ubicación actual
                    </button>

                    <label className="flex items-start gap-2 pt-4 text-sm">
                        <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1" />
                        <span className="text-slate-600">
                            Acepto el tratamiento de mis datos para procesar mi pedido y recibir comunicaciones sobre él.
                        </span>
                    </label>

                    {errorMsg && <p className="text-rose-600 text-sm">{errorMsg}</p>}
                </div>

                <div className="bg-white rounded-xl p-6 h-fit sticky top-24">
                    <h3 className="font-semibold mb-3">Tu pedido</h3>
                    <ul className="text-sm space-y-2 mb-4">
                        {items.map((i) => (
                            <li key={i.productId} className="flex justify-between">
                                <span className="truncate mr-2">{i.quantity} × {i.name}</span>
                                <span className="whitespace-nowrap">{fmt(i.price * i.quantity, i.currency)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between font-bold text-lg border-t pt-3">
                        <span>Total</span>
                        <span>{fmt(subtotal, currency)}</span>
                    </div>
                    <button
                        type="submit"
                        disabled={!form.consent || mut.isPending}
                        className="w-full mt-5 bg-imix-leaf-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-imix-leaf-500 disabled:opacity-50"
                    >
                        {mut.isPending ? "Procesando…" : "Confirmar pedido"}
                    </button>
                    <p className="text-xs text-slate-400 mt-3 text-center">
                        Recibirás confirmación por WhatsApp y email.
                    </p>
                </div>
            </form>
        </section>
    );
}

const cls = "w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-imix-leaf-500";

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
    return (
        <label className={`block ${wide ? "col-span-2" : ""}`}>
            <span className="text-xs font-medium text-slate-600 block mb-1">{label}</span>
            {children}
        </label>
    );
}
