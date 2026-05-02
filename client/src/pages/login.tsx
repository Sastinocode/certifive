import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#0D7C66", background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: "4px 0" }}
        >
          <ArrowLeft size={15} />
          Volver al inicio
        </button>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "36px 32px", boxShadow: "0 4px 24px rgba(15,23,42,.06)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, background: "#0D7C66", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-.02em", marginBottom: 4 }}>Iniciar Sesión</h1>
            <p style={{ fontSize: 13, color: "#64748B" }}>Accede a tu cuenta de CERTIFIVE</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 14, color: "#0F172A", outline: "none", background: "#fff", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "#0D7C66")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ width: "100%", height: 40, padding: "0 40px 0 12px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 14, color: "#0F172A", outline: "none", background: "#fff", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "#0D7C66")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", height: 40, background: "#0D7C66", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? .7 : 1, transition: "background .15s", marginTop: 4 }}
              onMouseOver={e => { if (!isLoading) e.currentTarget.style.background = "#0a6454"; }}
              onMouseOut={e => { e.currentTarget.style.background = "#0D7C66"; }}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 16 }}>
              ¿No tienes cuenta?{" "}
              <button onClick={() => navigate("/registro")} style={{ color: "#0D7C66", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Regístrate aquí
              </button>
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }}/>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }}/>
            </div>

            <button
              onClick={() => navigate("/solicitar-demo")}
              style={{ width: "100%", height: 40, background: "transparent", color: "#0D7C66", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all .15s" }}
              onMouseOver={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
            >
              Solicitar Cuenta Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}