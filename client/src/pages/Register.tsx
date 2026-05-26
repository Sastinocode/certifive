import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowRight, FileText, Clock, Upload, ShieldCheck } from "lucide-react";

const pwdRules = [
  (p: string) => p.length >= 8,
  (p: string) => /[A-Z]/.test(p),
  (p: string) => /[a-z]/.test(p),
  (p: string) => /[0-9]/.test(p),
];

const strengthLabels = ["", "Débil", "Regular", "Buena", "Segura"];
const strengthColors = ["", "#ef4444", "#f59e0b", "#eab308", "hsl(142 60% 45%)"];

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"particular" | "empresa">("particular");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const pwdStrength = pwdRules.filter(rule => rule(form.password)).length;
  const pwdValid = pwdStrength === 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.password) {
      toast({ title: "Campos requeridos", description: "Completa nombre, email y contraseña.", variant: "destructive" });
      return;
    }
    if (!pwdValid) {
      toast({ title: "Contraseña insegura", description: "Cumple todos los requisitos de seguridad.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dni: "",
      });
      toast({ title: "¡Cuenta creada!", description: "Bienvenido a Certifive." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error al crear cuenta", description: error.message || "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fi: React.CSSProperties = { border: "1.5px solid #e4e6ea", background: "white", color: "#0f1f2e", fontFamily: "inherit", outline: "none", transition: "all .15s" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(142 69% 36%)"; e.currentTarget.style.boxShadow = "0 0 0 4px hsl(142 69% 36% / 0.12)"; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#e4e6ea"; e.currentTarget.style.boxShadow = "none"; };

  const barColors = Array(4).fill("#ececef").map((_, i) => i < pwdStrength ? (strengthColors[pwdStrength] || "#ececef") : "#ececef");

  const benefits = [
    { icon: <FileText className="w-4 h-4" />, title: "Tus certificados, siempre a mano", desc: "Descarga el PDF original cuando lo necesites, aunque pasen años" },
    { icon: <Clock className="w-4 h-4" />, title: "Avisos antes de caducar", desc: "Te recordamos 6 meses antes para que renueves a tiempo" },
    { icon: <Upload className="w-4 h-4" />, title: "Sube documentos en segundos", desc: "DNI, planos, fotos — todo subido y guardado en tu cuenta" },
    { icon: <ShieldCheck className="w-4 h-4" />, title: "100% seguro y RGPD", desc: "Tus datos cifrados y nunca compartidos con terceros" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fafbfc", color: "#0f1f2e" }}>
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
          <button onClick={() => navigate("/login")} className="text-sm font-semibold hidden sm:inline bg-transparent border-none cursor-pointer p-0" style={{ color: "#0f1f2e" }}>
            Ya tengo cuenta →
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Form side */}
        <div className="flex items-center justify-center px-5 sm:px-8 py-10 sm:py-14">
          <div className="w-full max-w-[460px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase" style={{ background: "hsl(142 69% 36% / 0.1)", color: "hsl(142 69% 36%)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(142 69% 36%)" }} />
              Crear cuenta · gratis
            </span>
            <h1 className="text-4xl font-extrabold mt-4 leading-[1.1]" style={{ color: "#0f1f2e", letterSpacing: "-0.02em" }}>
              Empieza en<br />2 minutos
            </h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "#5e6772" }}>
              Crea tu cuenta para solicitar tu certificado, hacer seguimiento del expediente y descargar los PDFs cuando estén listos.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {/* Account type picker */}
              <div>
                <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(["particular", "empresa"] as const).map(type => (
                    <button key={type} type="button" onClick={() => setAccountType(type)}
                      className="flex gap-2.5 items-center p-3 rounded-xl text-left border"
                      style={{
                        borderColor: accountType === type ? "hsl(142 69% 36%)" : "#e4e6ea",
                        background: accountType === type ? "hsl(142 60% 97%)" : "white",
                        boxShadow: accountType === type ? "0 0 0 3px hsl(142 69% 36% / 0.1)" : "none",
                        cursor: "pointer", transition: "all .12s",
                      }}>
                      <span className="rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ width: 18, height: 18, borderColor: accountType === type ? "hsl(142 69% 36%)" : "#cdd1d8" }}>
                        {accountType === type && <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 69% 36%)" }} />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0f1f2e" }}>{type === "particular" ? "Particular" : "Empresa"}</p>
                        <p className="text-[11px]" style={{ color: "#5e6772" }}>{type === "particular" ? "Para tu vivienda" : "Local u oficina"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Nombre</label>
                  <input type="text" placeholder="Tu nombre" value={form.firstName} onChange={set("firstName")} required className="w-full h-[46px] px-4 rounded-xl text-sm" style={fi} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Apellidos</label>
                  <input type="text" placeholder="Tus apellidos" value={form.lastName} onChange={set("lastName")} className="w-full h-[46px] px-4 rounded-xl text-sm" style={fi} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Email</label>
                <div className="relative">
                  <input type="email" placeholder="tu@email.com" value={form.email} onChange={set("email")} required className="w-full h-[46px] pl-11 pr-4 rounded-xl text-sm" style={fi} onFocus={onFocus} onBlur={onBlur} />
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#5e6772" }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={form.password} onChange={set("password")} required className="w-full h-[46px] pl-11 pr-11 rounded-xl text-sm" style={fi} onFocus={onFocus} onBlur={onBlur} />
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#5e6772" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 border-none bg-transparent cursor-pointer" style={{ color: "#5e6772" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex gap-1">
                      {barColors.map((color, i) => <div key={i} className="flex-1 h-1 rounded-full" style={{ background: color, transition: "background .2s" }} />)}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold" style={{ color: strengthColors[pwdStrength] || "#8a939e" }}>{strengthLabels[pwdStrength] || ""}</span>
                      <span style={{ color: "#8a939e" }}>8+ chars · mayúscula · número</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: "#0f1f2e" }}>Confirmar contraseña</label>
                <div className="relative">
                  <input type="password" placeholder="Repite la contraseña" value={form.confirmPassword} onChange={set("confirmPassword")} required className="w-full h-[46px] pl-11 pr-4 rounded-xl text-sm" style={fi} onFocus={onFocus} onBlur={onBlur} />
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#5e6772" }} />
                </div>
              </div>

              {/* Terms & newsletter */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="w-4 h-4 rounded mt-0.5 cursor-pointer accent-emerald-600" />
                  <span className="text-xs leading-relaxed" style={{ color: "#5e6772" }}>Acepto las <span className="font-semibold" style={{ color: "hsl(142 60% 32%)" }}>condiciones de uso</span> y la <span className="font-semibold" style={{ color: "hsl(142 60% 32%)" }}>política de privacidad</span> de Certifive</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} className="w-4 h-4 rounded mt-0.5 cursor-pointer accent-emerald-600" />
                  <span className="text-xs leading-relaxed" style={{ color: "#5e6772" }}>Quiero recibir consejos de eficiencia energética y novedades por email (1 al mes, sin spam)</span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading || !pwdValid}
                className="w-full h-12 rounded-full border-none font-bold text-sm text-white flex items-center justify-center gap-2 mt-2"
                style={{ background: (isLoading || !pwdValid) ? "hsl(142 69% 50%)" : "hsl(142 69% 36%)", cursor: (isLoading || !pwdValid) ? "not-allowed" : "pointer", boxShadow: "0 1px 3px hsl(142 69% 36% / 0.3)", transition: "all .15s" }}>
                {isLoading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Creando cuenta...</>
                ) : (
                  <>Crear cuenta gratis<ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 text-[11px] font-semibold" style={{ color: "#8a939e" }}>
                <div className="flex-1 h-px" style={{ background: "#ececef" }} />
                o regístrate con
                <div className="flex-1 h-px" style={{ background: "#ececef" }} />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="h-11 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2.5" style={{ border: "1.5px solid #e4e6ea", background: "white", color: "#0f1f2e", cursor: "pointer" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .55 4.1 1.45L19.05 3.5C17.15 1.75 14.7.75 12 .75 7.4.75 3.45 3.4 1.5 7.25L4.85 9.85C5.85 7 8.7 5 12 5z"/>
                    <path fill="#34A853" d="M23.25 12.27c0-.83-.08-1.62-.22-2.4H12v4.55h6.3c-.27 1.43-1.1 2.65-2.35 3.45l3.6 2.8c2.1-1.95 3.3-4.83 3.3-8.4z"/>
                    <path fill="#4A90E2" d="M4.85 14.15A7.16 7.16 0 014.5 12c0-.75.12-1.47.34-2.15L1.5 7.25A11.21 11.21 0 00.75 12c0 1.8.42 3.5 1.18 5.02l2.92-2.87z"/>
                    <path fill="#FBBC05" d="M12 23.25c3.05 0 5.6-1 7.45-2.73l-3.6-2.8c-1 .67-2.3 1.05-3.85 1.05-3.3 0-6.15-2-7.15-4.87L1.5 16.75C3.45 20.6 7.4 23.25 12 23.25z"/>
                  </svg>
                  Google
                </button>
                <button type="button" className="h-11 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2.5" style={{ border: "1.5px solid #e4e6ea", background: "white", color: "#0f1f2e", cursor: "pointer" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.94-3.08.49-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.49C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </button>
              </div>

              <p className="text-center text-[13px] pt-3" style={{ color: "#5e6772" }}>
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => navigate("/login")} className="font-semibold bg-transparent border-none cursor-pointer p-0 text-[13px]" style={{ color: "hsl(142 60% 32%)" }}>Entrar</button>
              </p>
            </form>
          </div>
        </div>

        {/* Right decorative panel */}
        <aside className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #f0f7f3 0%, #e6f0ec 50%, #dde9e3 100%)" }}>
          <div className="relative max-w-md space-y-6" style={{ zIndex: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid white", color: "#0f1f2e" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(142 69% 36%)" }} />
              Sin tarjeta, sin compromiso
            </div>
            <h2 className="text-[2.4rem] font-extrabold leading-[1.05]" style={{ color: "#0f1f2e", letterSpacing: "-0.02em" }}>
              Tu portal del <span style={{ color: "hsl(142 69% 36%)" }}>propietario</span>.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#5e6772" }}>
              Una cuenta gratis para gestionar todos tus certificados, facturas y documentos en un único sitio.
            </p>
            <div className="space-y-2.5">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-2xl" style={{ background: "white", border: "1px solid hsl(142 30% 88%)", boxShadow: "0 4px 14px -8px rgba(15,31,46,.08)" }}>
                  <span className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "hsl(142 60% 95%)", color: "hsl(142 60% 30%)" }}>{b.icon}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0f1f2e" }}>{b.title}</p>
                    <p className="text-[12.5px] mt-0.5" style={{ color: "#5e6772" }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-center pt-2 leading-relaxed" style={{ color: "#5e6772" }}>
              Más de <span className="font-bold" style={{ color: "#0f1f2e" }}>3.200 propietarios</span> usan Certifive para gestionar sus inmuebles
            </p>
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
