import { Link, useSearchParams } from "react-router-dom";

export function ThankYouPage() {
    const [params] = useSearchParams();
    const orderId = params.get("order");
    return (
        <section className="max-w-xl mx-auto px-6 py-20 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-imix-leaf-700">¡Gracias por tu pedido!</h1>
            <p className="mt-4 text-slate-600">
                Hemos recibido tu solicitud. Te enviamos la confirmación por WhatsApp y email;
                cuando confirmemos el pago, tu tienda Imix asignada comenzará a preparar tu pedido.
            </p>
            {orderId && (
                <div className="mt-6 bg-white rounded-xl p-4 inline-block">
                    <div className="text-xs text-slate-500">Número interno</div>
                    <div className="font-mono text-sm">{orderId}</div>
                </div>
            )}
            <div className="mt-10">
                <Link to="/catalogo" className="text-imix-leaf-700 hover:underline">
                    ← Seguir comprando
                </Link>
            </div>
        </section>
    );
}
