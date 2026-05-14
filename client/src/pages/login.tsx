import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      toast({ title: "¡Bienvenido de vuelta!", description: "Has iniciado sesión correctamente." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error de autenticación", description: error.message, variant: "destructive" });
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
    <div style={{ minHeight: "100vh", background: "#f3faf5", display: "flex", flexDirection: "column", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Nav */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <LogoSVG />
        </div>
        <button
          onClick={() => navigate("/register")}
          style={{ fontSize: 14, fontWeight: 500, color: "#475569", background: "none", border: "none", cursor: "pointer" }}
        >
          ¿No tienes cuenta? <span style={{ color: "#1FA94B", fontWeight: 600 }}>Regístrate gratis</span>
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
              Bienvenido de vuelta
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-.03em" }}>
              Iniciar sesión
            </h1>
            <p style={{ fontSize: 15, color: "#64748B", margin: "10px 0 0" }}>
              Accede a tu cuenta de Certifive
            </p>
          </div>

          <form onSubmit={handleSubmit}>
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

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Contraseña *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "15px", borderRadius: 10, border: "none",
                background: isLoading ? "#a7d7b8" : "#1FA94B", color: "white",
                fontSize: 16, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background .2s",
              }}
              onMouseOver={e => { if (!isLoading) e.currentTarget.style.background = "#178A3C"; }}
              onMouseOut={e => { if (!isLoading) e.currentTarget.style.background = "#1FA94B"; }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                  Iniciando sesión...
                </>
              ) : "Iniciar sesión"}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 24 }}>
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => navigate("/register")}
              style={{ color: "#1FA94B", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
            >
              Crea una gratis
            </button>
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
