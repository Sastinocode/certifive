import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface RegisterProps {
  onBack: () => void;
  onShowLogin: () => void;
}

export default function Register({ onBack, onShowLogin }: RegisterProps) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "", password: "", confirmPassword: "", email: "",
    firstName: "", lastName: "", phone: "", company: "", licenseNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
    } catch (err: any) {
      setError(err.message?.includes("already exists") ? "El usuario ya existe" : "Error en el registro");
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
  const inputClass = "w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300";
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 block mb-1.5";

  return (
    <div className="min-h-screen bg-emerald-50 flex">
      <div className="hidden lg:flex lg:w-2/5 bg-emerald-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">energy_savings_leaf</span>
          </div>
          <span className="text-white font-bold text-xl">CERTIFIVE</span>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight tracking-tight">
            Únete a más de 500 certificadores profesionales.
          </h2>
          <p className="text-emerald-200 text-base leading-relaxed mb-8">
            Regístrate hoy y empieza a gestionar tus certificaciones CEE de forma eficiente y conforme a la normativa española.
          </p>
          <div className="space-y-3">
            {["Certificaciones ilimitadas", "Facturación legal incluida", "Soporte técnico especializado"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-[12px]">check</span>
                </div>
                <span className="text-emerald-200 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-500 text-xs">© 2024 CERTIFIVE. Certificación CEE Española.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">energy_savings_leaf</span>
            </div>
            <span className="font-bold text-emerald-900 text-lg">CERTIFIVE</span>
          </div>

          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight mb-1">Registro profesional</h1>
          <p className="text-sm text-emerald-700/60 mb-8">Crea tu cuenta de auditor energético certificado</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre</label>
                <input data-testid="input-firstName" className={inputClass} value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="María" />
              </div>
              <div>
                <label className={labelClass}>Apellidos</label>
                <input data-testid="input-lastName" className={inputClass} value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="García López" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Usuario *</label>
              <input data-testid="input-username" className={inputClass} value={form.username} onChange={e => update("username", e.target.value)} placeholder="tu_usuario" required />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input data-testid="input-email" type="email" className={inputClass} value={form.email} onChange={e => update("email", e.target.value)} placeholder="tu@email.com" />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input data-testid="input-phone" type="tel" className={inputClass} value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Empresa</label>
                <input data-testid="input-company" className={inputClass} value={form.company} onChange={e => update("company", e.target.value)} placeholder="Mi empresa S.L." />
              </div>
              <div>
                <label className={labelClass}>Nº Habilitación</label>
                <input data-testid="input-license" className={inputClass} value={form.licenseNumber} onChange={e => update("licenseNumber", e.target.value)} placeholder="CEE-2024-001" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Contraseña * (mín. 8 caracteres)</label>
              <input data-testid="input-password" type="password" className={inputClass} value={form.password} onChange={e => update("password", e.target.value)} placeholder="••••••••" required />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña *</label>
              <input data-testid="input-confirmPassword" type="password" className={inputClass} value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} placeholder="••••••••" required />
            </div>
            <button
              data-testid="btn-register"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-800 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta profesional"}
            </button>
          </form>

          <p className="text-center text-sm text-emerald-700/60 mt-6">
            ¿Ya tienes cuenta?{" "}
            <button onClick={onShowLogin} className="text-emerald-800 font-semibold hover:underline">
              Iniciar sesión
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
