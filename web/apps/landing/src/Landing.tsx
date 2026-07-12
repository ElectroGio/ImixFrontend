export function Landing() {
  return (
    <div className="min-h-screen bg-imix-leaf-50 text-slate-900">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="font-bold text-xl text-imix-leaf-700">Imix</div>
        <nav className="space-x-6 text-sm">
          <a href="#features" className="hover:text-imix-leaf-700">Features</a>
          <a href="#pricing" className="hover:text-imix-leaf-700">Precios</a>
          <a href="/login" className="bg-imix-leaf-700 text-white px-4 py-2 rounded">Ingresar</a>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-imix-leaf-700">Nutriendo el ser</h1>
        <p className="mt-6 text-xl text-slate-700 max-w-2xl mx-auto">
          La plataforma multicanal vegana que conecta tu marca con consumidores conscientes. Pedidos por web, móvil, WhatsApp y AI.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <a href="#contact" className="bg-imix-leaf-700 text-white px-6 py-3 rounded font-semibold hover:bg-imix-leaf-500">Solicitar demo</a>
          <a href="#features" className="border border-imix-leaf-700 text-imix-leaf-700 px-6 py-3 rounded font-semibold hover:bg-imix-leaf-700 hover:text-white">Ver más</a>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { t: "Multicanal", d: "Web, móvil, WhatsApp, AI: una sola fuente de verdad para tus pedidos." },
          { t: "Inventario inteligente", d: "Asignación automática de la tienda más cercana con stock disponible." },
          { t: "AI orquestador", d: "Tu asistente vegano 24/7: busca productos, crea pedidos y resuelve dudas." }
        ].map((f) => (
          <div key={f.t} className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-bold text-lg text-imix-leaf-700">{f.t}</h3>
            <p className="mt-2 text-slate-600">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-imix-leaf-700/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Imix Control Inventario · Nutriendo el ser
      </footer>
    </div>
  );
}
