import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { fmt, useCart } from "../lib/cart";
import { useState } from "react";

type ProductDetail = {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number;
    promoPrice?: number | null;
    currency: string;
    unit: string;
};

export function ProductPage() {
    const { id = "" } = useParams();
    const add = useCart((s) => s.add);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    const q = useQuery({
        queryKey: ["public", "product", id],
        queryFn: async () => (await api.get<ProductDetail>(`/public/products/${id}`)).data
    });

    const p = q.data;

    return (
        <section className="max-w-5xl mx-auto px-6 py-10">
            <Link to="/catalogo" className="text-sm text-imix-leaf-700 hover:underline">← Volver al catálogo</Link>
            {q.isLoading && <p className="mt-6">Cargando…</p>}
            {q.isError && <p className="mt-6 text-rose-600">Producto no encontrado.</p>}
            {p && (
                <div className="mt-6 grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl overflow-hidden">
                        {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="w-full h-96 object-cover" />
                            : <div className="w-full h-96 bg-imix-leaf-50 flex items-center justify-center text-7xl">🌿</div>}
                    </div>
                    <div>
                        <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                        <h1 className="text-3xl font-bold mt-1">{p.name}</h1>
                        <div className="mt-4 flex items-baseline gap-3">
                            {p.promoPrice ? (
                                <>
                                    <span className="text-3xl font-bold text-imix-leaf-700">{fmt(p.promoPrice, p.currency)}</span>
                                    <span className="text-slate-400 line-through">{fmt(p.price, p.currency)}</span>
                                </>
                            ) : (
                                <span className="text-3xl font-bold text-imix-leaf-700">{fmt(p.price, p.currency)}</span>
                            )}
                            <span className="text-sm text-slate-500">/ {p.unit}</span>
                        </div>
                        <p className="mt-4 text-slate-600 whitespace-pre-line">
                            {p.description ?? <em className="text-slate-400">Sin descripción disponible.</em>}
                        </p>

                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-slate-100">−</button>
                                <span className="px-4 tabular-nums">{qty}</span>
                                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-slate-100">+</button>
                            </div>
                            <button
                                onClick={() => {
                                    add({
                                        productId: p.id, sku: p.sku, name: p.name, imageUrl: p.imageUrl,
                                        price: p.promoPrice ?? p.price, currency: p.currency
                                    }, qty);
                                    setAdded(true);
                                    setTimeout(() => setAdded(false), 2000);
                                }}
                                className="flex-1 bg-imix-leaf-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-imix-leaf-500"
                            >
                                {added ? "✓ Agregado" : "Agregar al carrito"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
