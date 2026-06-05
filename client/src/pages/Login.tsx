import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, Star } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [requires2fa, setRequires2fa]     = useState(false);
  const [userId2fa, setUserId2fa]         = useState<number | null>(null);
  const [otpCode, setOtpCode]             = useState("");
  const [otpLoading, setOtpLoading]       = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    setIsLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) { setUnverifiedEmail(form.email); return; }
        throw new Error(data.message || "Error al iniciar sesión");
      }
      if (data.requires2fa) {
        setUserId2fa(data.userId);
        setRequires2fa(true);
        return;
      }
      // Login normal sin 2FA — usar datos de la primera llamada directamente
      localStorage.setItem("authToken", data.token);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      window.location.href = "/";
    } catch (error: any) {
      const msg: string = error.message || "";
      if (msg.startsWith("403:")) {
        setUnverifiedEmail(form.email);
      } else {
        toast({ title: "Error de autenticación", description: msg, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const res  = await fetch("/api/auth/2fa/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId2fa, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Código incorrecto");
      localStorage.setItem("authToken", data.token);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      window.location.href = "/";
    } catch (error: any) {
      toast({ title: "Código incorrecto", description: error.message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await res.json();
      toast({ title: "Email enviado", description: data.message });
    } catch {
      toast({ title: "Error", description: "No se pudo reenviar. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setResendLoading(false);
    }
  };

  // Pantalla 2FA
  if (requires2fa) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafbfc" }}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 mb-4">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verificación en dos pasos</h2>
            <p className="text-sm text-gray-500 mt-2">Hemos enviado un código de 6 díígitos a tu email. Caduca en 10 minutos.</p>
          </div>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-widest border-2 border-gray-200 rounded-xl py-4 focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={otpCode.length !== 6 || otpLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-colors"
              style={{ background: "#059669" }}
            >
              {otpLoading ? "Verificando..." : "Verificar código →"}
            </button>
            <button
              type="button"
              onClick={() => { setRequires2fa(false); setOtpCode(""); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Volver al login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fafbfc", color: "#0f1f2e" }}>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base" style={{ background: "hsl(142 69% 36%)" }}>C</div>
            <div className="text-left">
              <p className="text-sm font-bold leading-none" style={{ color: "#0f1f2e" }}>Certifive</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#5e6772" }}>Certificación energética</p>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#5e6772" }}>
            <span className="hover:text-gray-900 cursor-pointer">Cómo funciona</span>
            <span className="hover:text-gray-900 cursor-pointer">Precios</span>
            <span className="hover:text-gray-900 cursor-pointer">Contacto</span>
          </nav>
          <button onClick={() => navigate("/register")} className="text-sm font-semibold hidden sm:inline bg-transparent border-none cursor-pointer p-0" style={{ color: "#0f1f2e" }}>
            Crear cuenta →
          </button>
        </div>
      </header>

      {/* Split layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2">

        {/* Form side */}
        <div className="flex items-center justify-center px-5 sm:px-8 py-10 sm:py-16">
          <div className="w-full max-w-[420px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase" style={{ background: "hsl(142 69% 36% / 0.1)", color: "hsl(142 69% 36%)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(142 69% 36%)" }} />
              Acceso clientes
            </span>

            <h1 className="text-4xl font-extrabold mt-4 leading-[1.1]" style={{ color: "#0f1f2e", letterSpacing: "-0.02em" }}>
              Bienvenido<br />de vuelta 👋
            </h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "#5e6772" }}>
              Entra para descargar tu certificado, ver el estado de tu expediente o pagar facturas pendientes.
            </p>

            {unverifiedEmail && (
              <div className="mt-6 rounded-xl p-4" style={{ background: "#fffbeb", border: "1px solid #fcd34d" }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#92400e" }}>
                  <strong>Email no verificado.</strong> Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 border bg-transparent cursor-pointer"
                  style={{ color: "hsl(142 69% 36%)", borderColor: "hsl(142 69% 36%)", opacity: resendLoading ? 0.6 : 1 }}
                >
                  {resendLoading ? "Enviando..." : "Reenviar email de verificación"}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Email</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={set("email")}
                    required
                    className="w-full h-[46px] pl-11 pr-4 rounded-xl text-sm"
                    style={{ border: "1.5px solid #e4e6ea", background: "white", color: "#0f1f2e", fontFamily: "inherit", outline: "none", transition: "all .15s" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(142 69% 36%)"; e.currentTarget.style.boxShadow = "0 0 0 4px hsl(142 69% 36% / 0.12)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#e4e6ea"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#5e6772" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[12.5px] font-semibold" style={{ color: "#0f1f2e" }}>Contraseña</label>
                  <span className="text-xs font-semibold cursor-pointer" style={{ color: "hsl(142 60% 32%)" }}>¿Olvidaste tu contraseña?</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={form.password}
                    onChange={set("password")}
                    required
                    className="w-full h-[46px] pl-11 pr-11 rounded-xl text-sm"
                    style={{ border: "1.5px solid #e4e6ea", background: "white", color: "#0f1f2e", fontFamily: "inherit", outline: "none", transition: "all .15s" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(142 69% 36%)"; e.currentTarget.style.boxShadow = "0 0 0 4px hsl(142 69% 36% / 0.12)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#e4e6ea"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#5e6772" }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 border-none bg-transparent cursor-pointer"
                    style={{ color: "#5e6772" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                />
                <span className="text-xs" style={{ color: "#5e6772" }}>Mantener sesión iniciada en este dispositivo</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full border-none font-bold text-sm text-white flex items-center justify-center gap-2 mt-2"
                style={{
                  background: isLoading ? "hsl(142 69% 50%)" : "hsl(142 69% 36%)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 3px hsl(142 69% 36% / 0.3)",
                  transition: "all .15s",
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

  <p className="text-center text-[13px] pt-3" style={{ color: "#5e6772" }}>
                ¿Aún no tienes cuenta?{" "}
                <button onClick={() => navigate("/register")} className="font-semibold bg-transparent border-none cursor-pointer p-0 text-[13px]" style={{ color: "hsl(142 60% 32%)" }}>
                  Crear cuenta
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Decorative right panel */}
        <aside className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #f0f7f3 0%, #e6f0ec 50%, #dde9e3 100%)" }}>
          <div style={{ position: "absolute", width: 480, height: 480, top: -120, right: -120, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, hsl(142 60% 60% / 0.18), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 360, height: 360, bottom: -100, left: -80, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, hsl(190 70% 60% / 0.12), transparent 65%)", pointerEvents: "none" }} />
          <div className="relative max-w-md space-y-6" style={{ zIndex: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid white", color: "#0f1f2e" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(142 69% 36%)" }} />
              Más de 1.800 certificados emitidos
            </div>

            <h2 className="text-[2.4rem] font-extrabold leading-[1.05]" style={{ color: "#0f1f2e", letterSpacing: "-0.02em" }}>
              Tu certificado energético,{" "}
              <span style={{ color: "hsl(142 69% 36%)" }}>100% online</span>.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#5e6772" }}>
              Visita técnica, registro oficial en la CCAA y entrega del PDF en menos de 5 días. Sin desplazamientos a oficinas.
            </p>

            <div className="rounded-[18px] p-6" style={{ background: "white", border: "1px solid hsl(142 30% 88%)", boxShadow: "0 12px 36px -16px rgba(15,31,46,.18)" }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm" style={{ background: "#d1fae5", color: "#065f46" }}>AL</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-[13px] leading-snug" style={{ color: "#0f1f2e" }}>"Rapidísimo y muy clara la comunicación. Me lo entregaron en 3 días y el PDF perfecto para la notaría."</p>
                  <p className="text-[11px] mt-2" style={{ color: "#5e6772" }}>Ana López · vivienda en Madrid</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid hsl(142 30% 88%)", boxShadow: "0 8px 24px -12px rgba(15,31,46,.12)" }}>
                <p className="text-[28px] font-extrabold leading-none" style={{ color: "#0f1f2e", letterSpacing: "-0.02em" }}>1.847</p>
                <p className="text-[11px] mt-1.5" style={{ color: "#5e6772" }}>Certificados<br />emitidos</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid hsl(142 30% 88%)", boxShadow: "0 8px 24px -12px rgba(15,31,46,.12)" }}>
                <p className="text-[28px] font-extrabold leading-none" style={{ color: "#0f1f2e", letterSpacing: "-0.02em" }}>4,9<span className="text-amber-400">★</span></p>
                <p className="text-[11px] mt-1.5" style={{ color: "#5e6772" }}>312 reseñas<br />en Google</p>
              </div>
              <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: "white", border: "1px solid hsl(142 30% 88%)", boxShadow: "0 8px 24px -12px rgba(15,31,46,.12)" }}>
                <p className="text-[11px]" style={{ color: "#5e6772" }}>Letra media<br />certificados</p>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-7 rounded flex items-center justify-center text-white text-sm font-extrabold" style={{ background: "#50b848" }}>B</span>
                  <span className="text-[11px]" style={{ color: "#5e6772" }}>tras mejora</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 pt-2 text-[11px]" style={{ color: "#5e6772" }}>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "hsl(142 69% 36%)" }} />
                Pago 100% seguro
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "hsl(142 69% 36%)" }} />
                Registro oficial CCAA
              </span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: "#5e6772" }}>
          <p>© 2026 Certifive Soluciones Energéticas S.L. · CIF B-87654321 · Madrid · COIIM 21548</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-900 cursor-pointer">Aviso legal</span>
            <span className="hover:text-gray-900 cursor-pointer">Privacidad</span>
            <span className="hover:text-gray-900 cursor-pointer">Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
