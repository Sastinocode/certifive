import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();

  // Auto-redirect to dashboard after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => navigate("/"), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") ?? "";

  const planLabel: Record<string, string> = {
    basico: "Básico",
    profesional: "Profesional",
    empresa: "Empresa",
    pay_per_use: "Pay-per-use",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(15,23,42,.06)" }}>

        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <CheckCircle size={36} color="#1FA94B" />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F1923", letterSpacing: "-.02em", marginBottom: 12 }}>
          ¡Suscripción activada!
        </h1>

        {plan && (
          <p style={{ fontSize: 15, color: "#475569", marginBottom: 8 }}>
            Plan <strong style={{ color: "#1FA94B" }}>{planLabel[plan] ?? plan}</strong> activado correctamente.
          </p>
        )}

        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32, lineHeight: 1.6 }}>
          Tienes 7 días de prueba gratuita. No se realizará ningún cargo hasta que finalice el período de prueba.
        </p>

        <button
          onClick={() => navigate("/")}
          style={{ width: "100%", background: "#1FA94B", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
          onMouseOver={e => (e.currentTarget.style.background = "#178A3C")}
          onMouseOut={e => (e.currentTarget.style.background = "#1FA94B")}
        >
          Ir al dashboard →
        </button>

        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 16 }}>
          Redirigiendo automáticamente en unos segundos…
        </p>
      </div>
    </div>
  );
}
