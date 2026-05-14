import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const pwdRules = [
  { label: "Mínimo 8 caracteres",              test: (p: string) => p.length >= 8 },
  { label: "Al menos una mayúscula",            test: (p: string) => /[A-Z]/.test(p) },
  { label: "Al menos una minúscula",            test: (p: string) => /[a-z]/.test(p) },
  { label: "Al menos un número",               test: (p: string) => /[0-9]/.test(p) },
  { label: "Al menos un carácter especial (!@#$%^&)", test: (p: string) => /[!@#$%^&*]/.test(p) },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const pwdValid = pwdRules.every(({ test }) => test(form.password));

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

  const LogoSVG = () => (
    <svg width="140" height="36" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 17L6 28L22 28L22 17L14 9Z" fill="none" stroke="#1FA94B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      <rect x="9" y="22" width="2.5" height="6" rx="0.5" fill="#1FA94B"/>
      <rect x="13" y="19" width="2.5" height="9" rx="0.5" fill="#84CC16"/>
      <rect x="17" y="16" width="2.5" height="12" rx="0.5" fill="#F59E0B"/>
      <text x="30" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="19" fill="#0F172A">certifive</text>
    </svg>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Nav */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <LogoSVG />
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{ fontSize: 14, fontWeight: 500, color: "#475569", background: "none", border: "none", cursor: "pointer" }}
        >
          ¿Ya tienes cuenta? <span style={{ color: "#1FA94B", fontWeight: 600 }}>Inicia sesión</span>
        </button>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{
          background: "white", borderRadius: 20, border: "1px solid #E5E7EB",
          boxShadow: "0 4px 32px rgba(15,23,42,.08)", padding: "48px 40px", width: "100%", maxWidth: 460,
        }}>
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#e8f6ec", color: "#178A3C", fontSize: 13, fontWeight: 600,
              padding: "6px 14px", borderRadius: 999, marginBottom: 20,
              border: "1px solid rgba(31,169,75,.18)",
            }}>
              <span style={{ width: 7, height: 7, background: "#1FA94B", borderRadius: "50%", display: "inline-block" }} />
              7 días de prueba gratuita
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-.03em" }}>
              Crea tu cuenta
            </h1>
            <p style={{ fontSize: 15, color: "#64748B", margin: "10px 0 0" }}>
              Empieza a gestionar tus certificaciones energéticas
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={form.firstName}
                  onChange={set("firstName")}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Apellidos</label>
                <input
                  type="text"
                  placeholder="Tus apellidos"
                  value={form.lastName}
                  onChange={set("lastName")}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={set("email")}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Contraseña *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={set("password")}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                  {pwdRules.map(({ label, test }) => {
                    const ok = test(form.password);
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, fontSize: 12 }}>
                        <span style={{ color: ok ? "#1FA94B" : "#EF4444", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>
                          {ok ? "✓" : "✗"}
                        </span>
                        <span style={{ color: ok ? "#374151" : "#9CA3AF" }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Confirmar contraseña *</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                style={inputStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !pwdValid}
              style={{
                width: "100%", padding: "15px", borderRadius: 10, border: "none",
                background: (isLoading || !pwdValid) ? "#a7d7b8" : "#1FA94B", color: "white",
                fontSize: 16, fontWeight: 700, cursor: (isLoading || !pwdValid) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background .2s",
              }}
              onMouseOver={e => { if (!isLoading && pwdValid) e.currentTarget.style.background = "#178A3C"; }}
              onMouseOut={e => { if (!isLoading && pwdValid) e.currentTarget.style.background = "#1FA94B"; }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                  Creando cuenta...
                </>
              ) : "Crear cuenta gratis"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            Al crear una cuenta aceptas nuestros{" "}
            <a href="#" style={{ color: "#1FA94B", textDecoration: "none" }}>Términos de Servicio</a>{" "}
            y{" "}
            <a href="#" style={{ color: "#1FA94B", textDecoration: "none" }}>Política de Privacidad</a>.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #E5E7EB",
  fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAFA", transition: "border-color .15s",
};
