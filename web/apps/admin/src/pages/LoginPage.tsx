import { useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const [email, setEmail] = useState("admin@imix.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data.accessToken, data.refreshToken, data.user);
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.title ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-imix-leaf-50">
      <form onSubmit={submit} className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-imix-leaf-700">Imix Admin</h1>
        <p className="text-sm text-slate-500 mb-6">Nutriendo el ser</p>
        <label className="block text-sm font-medium">Email</label>
        <input className="w-full mt-1 mb-3 border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="block text-sm font-medium">Contraseña</label>
        <input type="password" className="w-full mt-1 mb-4 border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button disabled={loading} className="w-full bg-imix-leaf-500 hover:bg-imix-leaf-700 disabled:opacity-50 text-white rounded py-2 font-semibold">
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
