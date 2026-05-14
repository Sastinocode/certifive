import { useLocation } from "wouter";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(15,23,42,.06)" }}>

        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <XCircle size={36} color="#dc2626" />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F1923", letterSpacing: "-.02em", marginBottom: 12 }}>
          Pago cancelado
        </h1>

        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32, lineHeight: 1.6 }}>
          No se ha realizado ningún cargo. Puedes volver a elegir un plan cuando quieras.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => navigate("/#precios")}
            style={{ width: "100%", background: "#1FA94B", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
            onMouseOver={e => (e.currentTarget.style.background = "#178A3C")}
            onMouseOut={e => (e.currentTarget.style.background = "#1FA94B")}
          >
            Ver planes de precios
          </button>
          <button
            onClick={() => navigate("/")}
            style={{ width: "100%", background: "#fff", color: "#0F1923", border: "1px solid #E2E8F0", borderRadius: 8, padding: "11px 20px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
