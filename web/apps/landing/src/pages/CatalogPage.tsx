import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { fmt, useCart } from "../lib/cart";

type Product = {
    id: string;
    sku: string;
    name: string;
    price: number;
    currency: string;
    isFeatured: boolean;
    imageUrl?: string | null;
};

export function CatalogPage() {
    const [search, setSearch] = useState("");
    const add = useCart((s) => s.add);
    const q = useQuery({
        queryKey: ["public", "catalog", search],
        queryFn: async () => (await api.get<{ items: Product[]; total: number }>("/public/products", {
            params: { size: 60, search: search || undefined }
        })).data
    });

    return (
        <section className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h2 className="text-3xl font-bold">Catálogo</h2>
                    <p className="text-sm text-slate-500 mt-1">Todos nuestros productos veganos, listos para tu puerta.</p>
                </div>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar…"
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm w-72"
                />
            </div>

            {q.isLoading && <p className="text-slate-500">Cargando…</p>}
            {q.data?.items.length === 0 && (
                <div className="text-center py-16 text-slate-400">Sin resultados.</div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {q.data?.items.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                        <Link to={`/producto/${p.id}`}>
                            {p.imageUrl
                                ? <img src={p.imageUrl} alt={p.name} className="w-full h-44 object-cover" />
                                : <div className="w-full h-44 bg-imix-leaf-50 flex items-center justify-center text-5xl">🌿</div>}
                        </Link>
                        <div className="p-3">
                            <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                            <div className="font-semibold line-clamp-2 min-h-[3rem]">{p.name}</div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="font-bold text-imix-leaf-700">{fmt(p.price, p.currency)}</span>
                                <button
                                    onClick={() => add({ productId: p.id, sku: p.sku, name: p.name, imageUrl: p.imageUrl, price: p.price, currency: p.currency })}
                                    className="text-xs bg-imix-leaf-700 text-white px-2.5 py-1 rounded hover:bg-imix-leaf-500"
                                >+ Agregar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
