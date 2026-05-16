import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";

const pwdRules = [
  { label: "Mínimo 8 caracteres",                   test: (p: string) => p.length >= 8 },
  { label: "Al menos una mayúscula",                 test: (p: string) => /[A-Z]/.test(p) },
  { label: "Al menos una minúscula",                 test: (p: string) => /[a-z]/.test(p) },
  { label: "Al menos un número",                     test: (p: string) => /[0-9]/.test(p) },
  { label: "Al menos un carácter especial (!@#$%^&)", test: (p: string) => /[!@#$%^&*]/.test(p) },
];

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const pwdValid = pwdRules.every(({ test }) => test(form.newPassword));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      toast({ title: "Enlace no válido", description: "El enlace de recuperación no contiene token.", variant: "destructive" });
      return;
    }
    if (!pwdValid) {
      toast({ title: "Contraseña insegura", description: "Cumple todos los requisitos de seguridad.", variant: "destructive" });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        toast({ title: "Error", description: data.message || "El enlace ha caducado o no es válido.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de conexión", description: "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">C5</span>
            </div>
            <span className="text-xl font-black text-emerald-900">certifive</span>
          </div>
          <p className="text-sm text-emerald-700/60">Certificación Energética</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Contraseña actualizada</h1>
              <p className="text-sm text-gray-500 mb-6">
                Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Nueva contraseña</h1>
                  <p className="text-xs text-gray-500">Elige una contraseña segura</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nueva contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.newPassword}
                      onChange={set("newPassword")}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Indicadores */}
                  {form.newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {pwdRules.map(({ label, test }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${test(form.newPassword) ? "bg-emerald-500" : "bg-gray-300"}`} />
                          <span className={`text-[11px] ${test(form.newPassword) ? "text-emerald-600" : "text-gray-400"}`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !pwdValid || form.newPassword !== form.confirmPassword}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors mt-2"
                >
                  {isLoading ? "Guardando…" : "Cambiar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Recordaste la contraseña?{" "}
          <button onClick={() => navigate("/login")} className="text-emerald-600 hover:underline">
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}
