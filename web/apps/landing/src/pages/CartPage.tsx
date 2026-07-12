import { Link, useNavigate } from "react-router-dom";
import { fmt, useCart } from "../lib/cart";

export function CartPage() {
    const items = useCart((s) => s.items);
    const setQty = useCart((s) => s.setQuantity);
    const remove = useCart((s) => s.remove);
    const subtotal = useCart((s) => s.subtotal());
    const currency = items[0]?.currency ?? "COP";
    const nav = useNavigate();

    return (
        <section className="max-w-4xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-6">Tu carrito</h1>

            {items.length === 0 && (
                <div className="bg-white rounded-xl p-12 text-center">
                    <p className="text-slate-500 mb-4">Tu carrito está vacío.</p>
                    <Link to="/catalogo" className="inline-block bg-imix-leaf-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-imix-leaf-500">
                        Explorar catálogo
                    </Link>
                </div>
            )}

            {items.length > 0 && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                        {items.map((i) => (
                            <div key={i.productId} className="bg-white rounded-xl p-4 flex gap-4 items-center">
                                {i.imageUrl
                                    ? <img src={i.imageUrl} alt="" className="w-20 h-20 rounded object-cover" />
                                    : <div className="w-20 h-20 rounded bg-imix-leaf-50 flex items-center justify-center text-2xl">🌿</div>}
                                <div className="flex-1">
                                    <div className="text-xs font-mono text-slate-400">{i.sku}</div>
                                    <div className="font-semibold">{i.name}</div>
                                    <div className="text-sm text-imix-leaf-700 font-bold">{fmt(i.price, i.currency)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center border border-slate-300 rounded">
                                        <button onClick={() => setQty(i.productId, i.quantity - 1)} className="px-2 py-1 hover:bg-slate-100">−</button>
                                        <span className="px-3 tabular-nums text-sm">{i.quantity}</span>
                                        <button onClick={() => setQty(i.productId, i.quantity + 1)} className="px-2 py-1 hover:bg-slate-100">+</button>
                                    </div>
                                    <button onClick={() => remove(i.productId)} className="text-xs text-rose-600 hover:underline ml-2">Quitar</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl p-6 h-fit sticky top-24">
                        <h3 className="font-semibold mb-3">Resumen</h3>
                        <div className="flex justify-between text-sm text-slate-600 mb-1">
                            <span>Subtotal</span>
                            <span>{fmt(subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mb-3">
                            <span>Envío</span>
                            <span>Se calcula en el checkout</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-3">
                            <span>Total</span>
                            <span>{fmt(subtotal, currency)}</span>
                        </div>
                        <button
                            onClick={() => nav("/checkout")}
                            className="w-full mt-5 bg-imix-leaf-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-imix-leaf-500"
                        >Ir a checkout</button>
                        <Link to="/catalogo" className="block text-center text-sm text-slate-500 hover:text-imix-leaf-700 mt-3">
                            Seguir comprando
                        </Link>
                    </div>
                </div>
            )}
        </section>
    );
}
