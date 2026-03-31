import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface LoginProps {
  onBack: () => void;
  onShowRegister: () => void;
}

export default function Login({ onBack, onShowRegister }: LoginProps) {
  const { login, loginDemo } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err: any) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await loginDemo();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">C5</span>
            </div>
            <span className="text-white font-bold text-2xl">CERTIFIVE</span>
          </div>
          <h2 className="text-white text-2xl font-semibold">Iniciar sesión</h2>
          <p className="text-white/50 text-sm mt-1">Accede a tu plataforma de certificación</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Usuario</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Tu usuario"
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Tu contraseña"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-800 px-4 text-white/40 text-sm">o</span>
            </div>
          </div>

          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full mt-4 border border-white/20 text-white py-3 rounded-xl font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Acceder con cuenta demo
          </button>
        </div>

        <div className="text-center mt-6 space-y-3">
          <button onClick={onShowRegister} className="text-teal-400 hover:text-teal-300 text-sm transition-colors">
            ¿No tienes cuenta? Regístrate aquí
          </button>
          <br />
          <button onClick={onBack} className="text-white/40 hover:text-white/60 text-sm transition-colors">
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
