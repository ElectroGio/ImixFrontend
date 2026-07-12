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

export function HomePage() {
    const featured = useQuery({
        queryKey: ["public", "featured"],
        queryFn: async () => (await api.get<{ items: Product[] }>("/public/products", { params: { size: 8 } })).data.items
    });
    const add = useCart((s) => s.add);

    return (
        <>
            <section className="max-w-5xl mx-auto px-6 py-20 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-imix-leaf-700">Nutriendo el ser</h1>
                <p className="mt-6 text-xl text-slate-700 max-w-2xl mx-auto">
                    Productos veganos que llegan a tu puerta desde la tienda Imix más cercana.
                    Chat con nuestra IA, seguimiento en vivo y sin registro obligatorio.
                </p>
                <div className="mt-10 flex gap-4 justify-center">
                    <Link to="/catalogo" className="bg-imix-leaf-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-imix-leaf-500">Ver catálogo</Link>
                    <a href="#features" className="border border-imix-leaf-700 text-imix-leaf-700 px-6 py-3 rounded-lg font-semibold hover:bg-imix-leaf-700 hover:text-white">Cómo funciona</a>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Destacados</h2>
                    <Link to="/catalogo" className="text-sm text-imix-leaf-700 hover:underline">Ver todo →</Link>
                </div>
                {featured.isLoading && <p className="text-slate-500">Cargando productos…</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featured.data?.map((p) => (
                        <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                            <Link to={`/producto/${p.id}`}>
                                {p.imageUrl
                                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover" />
                                    : <div className="w-full h-40 bg-imix-leaf-50 flex items-center justify-center text-4xl">🌿</div>}
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

            <section id="features" className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
                {[
                    { t: "Multicanal", d: "Web, WhatsApp, móvil: una sola experiencia unificada." },
                    { t: "Tienda cercana", d: "Asignamos automáticamente la Imix más cercana con stock." },
                    { t: "IA 24/7", d: "Nuestro asistente vegano te ayuda a elegir y hacer tu pedido." }
                ].map((f) => (
                    <div key={f.t} className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg text-imix-leaf-700">{f.t}</h3>
                        <p className="mt-2 text-slate-600">{f.d}</p>
                    </div>
                ))}
            </section>
        </>
    );
}
