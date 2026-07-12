import { Link, NavLink, Outlet } from "react-router-dom";
import { useCart } from "../lib/cart";

export function LandingLayout() {
    const count = useCart((s) => s.count());
    return (
        <div className="min-h-screen bg-imix-leaf-50 text-slate-900">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🌱</span>
                        <div>
                            <div className="font-bold text-lg text-imix-leaf-700 leading-tight">Imix</div>
                            <div className="text-[10px] text-slate-500 leading-tight">Nutriendo el ser</div>
                        </div>
                    </Link>
                    <nav className="flex items-center gap-4 text-sm">
                        <NavLink to="/" end className={({ isActive }) => isActive ? "text-imix-leaf-700 font-semibold" : "text-slate-600 hover:text-imix-leaf-700"}>Inicio</NavLink>
                        <NavLink to="/catalogo" className={({ isActive }) => isActive ? "text-imix-leaf-700 font-semibold" : "text-slate-600 hover:text-imix-leaf-700"}>Catálogo</NavLink>
                        <Link to="/carrito" className="relative bg-imix-leaf-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-imix-leaf-500">
                            🛒 Carrito
                            {count > 0 && (
                                <span className="absolute -top-2 -right-2 bg-imix-sun-500 text-slate-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {count}
                                </span>
                            )}
                        </Link>
                    </nav>
                </div>
            </header>
            <main><Outlet /></main>
            <footer className="border-t border-imix-leaf-700/10 py-8 text-center text-sm text-slate-500 mt-16">
                © {new Date().getFullYear()} Imix Control Inventario · Nutriendo el ser
            </footer>
        </div>
    );
}
