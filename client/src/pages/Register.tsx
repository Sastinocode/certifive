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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">C5</span>
            </div>
            <span className="text-white font-bold text-2xl">CERTIFIVE</span>
          </div>
          <h2 className="text-white text-2xl font-semibold">Registro profesional</h2>
          <p className="text-white/50 text-sm mt-1">Crea tu cuenta de certificador energético</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Nombre</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Apellidos</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="Apellidos"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Usuario *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Nombre de usuario"
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="+34 600 000 000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Empresa</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="Empresa"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Nº Habilitación</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="Habilitación"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Contraseña * (mín. 8 caracteres)</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Contraseña"
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Confirmar contraseña *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Repite la contraseña"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Crear cuenta profesional"}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-3">
          <button onClick={onShowLogin} className="text-teal-400 hover:text-teal-300 text-sm transition-colors">
            ¿Ya tienes cuenta? Iniciar sesión
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
