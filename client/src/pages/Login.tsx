import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface LoginProps {
  onBack: () => void;
  onShowRegister: () => void;
}

export default function Login({ onBack, onShowRegister }: LoginProps) {
  const { login, loginDemo } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const isDemoMode = new URLSearchParams(window.location.search).get("demo") === "true";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password, rememberMe);
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("no registrado")) setError("Email o usuario no registrado");
      else if (msg.includes("incorrecta")) setError("Contraseña incorrecta");
      else if (msg.includes("429") || msg.includes("Demasiados")) setError("Demasiados intentos. Espera 1 minuto.");
      else setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
    } catch {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">energy_savings_leaf</span>
          </div>
          <span className="text-white font-bold text-xl">CERTIFIVE</span>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">
            La plataforma CEE<br />para profesionales.
          </h2>
          <p className="text-emerald-200 text-lg leading-relaxed mb-10">
            Gestiona tus certificaciones energéticas con precisión y eficiencia desde un solo lugar.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { num: "+400%", label: "Más ingresos" },
              { num: "85%", label: "Menos tiempo" },
              { num: "24h", label: "Entrega" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-black text-white mb-1">{s.num}</p>
                <p className="text-emerald-300 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-500 text-xs">© 2024 CERTIFIVE. Certificación CEE Española.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">energy_savings_leaf</span>
            </div>
            <span className="font-bold text-emerald-900 text-lg">CERTIFIVE</span>
          </div>

          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight mb-1">Bienvenido de nuevo</h1>
          <p className="text-sm text-emerald-700/60 mb-8">Inicia sesión en tu cuenta de certificador</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 block mb-1.5">Usuario</label>
              <input
                data-testid="input-username"
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="tu_usuario"
                required
                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Contraseña</label>
                <button
                  type="button"
                  onClick={() => alert("Próximamente: se enviará un enlace de recuperación a tu email registrado.")}
                  className="text-[11px] text-emerald-700/60 hover:text-emerald-800 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                data-testid="input-password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-300"
              />
              <span className="text-sm text-emerald-700/70">Recordarme durante 30 días</span>
            </label>
            <button
              data-testid="btn-login"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-800 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {isDemoMode && (
            <>
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-emerald-200" />
                <span className="text-xs text-emerald-700/50 font-medium">o continúa con</span>
                <div className="flex-1 h-px bg-emerald-200" />
              </div>
              <button
                data-testid="btn-demo"
                onClick={handleDemo}
                disabled={demoLoading}
                className="w-full py-3 border-2 border-orange-200 text-orange-700 bg-orange-50 rounded-xl font-semibold hover:bg-orange-100 disabled:opacity-60 transition-colors text-sm"
              >
                {demoLoading ? "Cargando demo..." : "▶ Acceder a la demo"}
              </button>
            </>
          )}

          <p className="text-center text-sm text-emerald-700/60 mt-6">
            ¿No tienes cuenta?{" "}
            <button onClick={onShowRegister} className="text-emerald-800 font-semibold hover:underline">
              Regístrate gratis
            </button>
          </p>
          <p className="text-center mt-3">
            <button onClick={onBack} className="text-xs text-emerald-700/50 hover:text-emerald-700 transition-colors">
              ← Volver al inicio
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
