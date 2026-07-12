import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useRealtimeNotifications } from "../lib/realtime";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/products", label: "Productos" },
  { to: "/stores", label: "Tiendas" },
  { to: "/inventory", label: "Inventario" },
  { to: "/orders", label: "Pedidos" },
  { to: "/ai", label: "AI Assistant" }
];

export function Shell({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex h-full">
      <aside className="w-60 bg-imix-leaf-700 text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <h1 className="text-xl font-bold">Imix</h1>
          <p className="text-xs opacity-80">Nutriendo el ser</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 text-xs">
          <div className="opacity-80 truncate">{user?.email}</div>
          <button onClick={logout} className="mt-2 w-full rounded bg-white/10 hover:bg-white/20 py-1.5">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
