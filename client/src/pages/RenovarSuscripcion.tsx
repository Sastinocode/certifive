import { useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, CreditCard, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

const PLANS = [
  { id: "basico",      label: "Básico",       price: "19€/mes",  desc: "Hasta 10 certificados/mes" },
  { id: "profesional", label: "Profesional",  price: "49€/mes",  desc: "Hasta 50 certificados/mes", popular: true },
  { id: "empresa",     label: "Empresa",      price: "99€/mes",  desc: "Certificados ilimitados" },
];

export default function RenovarSuscripcion() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const startCheckout = async (plan: string) => {
    setLoading(plan);
    setError("");
    try {
      const data = await apiRequest("POST", "/api/stripe/create-checkout-session", { plan });
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message ?? "No se pudo iniciar el pago. Inténtalo de nuevo.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 560, width: "100%" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef9c3", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <AlertTriangle size={28} color="#854d0e" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F1923", letterSpacing: "-.02em", marginBottom: 10 }}>
            Tu suscripción necesita atención
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
            Tu plan ha expirado o tiene un pago pendiente. Elige un plan para recuperar el acceso a tu dashboard.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{
                background: "#fff",
                border: plan.popular ? "2px solid #1FA94B" : "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#0F1923" }}>{plan.label}</span>
                  {plan.popular && (
                    <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Más popular</span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{plan.desc}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0F1923" }}>{plan.price}</span>
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={!!loading}
                  style={{
                    background: plan.popular ? "#1FA94B" : "#fff",
                    color: plan.popular ? "#fff" : "#0F1923",
                    border: plan.popular ? "none" : "1px solid #E2E8F0",
                    borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading && loading !== plan.id ? .5 : 1,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    transition: "background .15s",
                  }}
                  onMouseOver={e => { if (!loading && plan.popular) e.currentTarget.style.background = "#178A3C"; }}
                  onMouseOut={e => { if (plan.popular) e.currentTarget.style.background = "#1FA94B"; }}
                >
                  <CreditCard size={14} />
                  {loading === plan.id ? "Redirigiendo…" : "Reactivar"}
                  {loading !== plan.id && <ArrowRight size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#991b1b", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
          7 días de prueba gratuita · Sin permanencia · Cancela cuando quieras
        </p>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={logout}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B7280", textDecoration: "underline" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
