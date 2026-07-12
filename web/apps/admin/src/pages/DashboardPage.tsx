export function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { k: "Pedidos hoy", v: "—" },
          { k: "Inventario bajo", v: "—" },
          { k: "Conversiones AI", v: "—" }
        ].map((c) => (
          <div key={c.k} className="bg-white rounded shadow p-5">
            <p className="text-xs uppercase text-slate-500">{c.k}</p>
            <p className="text-3xl font-bold text-imix-leaf-700 mt-1">{c.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
