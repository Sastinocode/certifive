import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import {
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Megaphone,
  MousePointer,
  Bell,
  CheckCircle,
  Mail
} from "lucide-react";

const features = [
  {
    icon: Megaphone,
    title: "Campañas publicitarias",
    desc: "Gestiona anuncios en Google Ads, Facebook e Instagram directamente desde CERTIFIVE, segmentados por zona y tipo de inmueble.",
  },
  {
    icon: Target,
    title: "Audiencias inteligentes",
    desc: "Crea audiencias basadas en tus clientes actuales y llega a propietarios con perfil similar en tu área de trabajo.",
  },
  {
    icon: BarChart3,
    title: "Analítica de captación",
    desc: "Métricas unificadas de conversión, coste por lead y retorno de inversión por canal de marketing.",
  },
  {
    icon: Users,
    title: "CRM de prospectos",
    desc: "Pipeline de clientes potenciales con seguimiento automático, recordatorios y plantillas de contacto.",
  },
  {
    icon: MousePointer,
    title: "Landing pages automáticas",
    desc: "Genera páginas de captación personalizadas con tu marca, certificados de ejemplo y formulario de contacto.",
  },
  {
    icon: TrendingUp,
    title: "Informes de marketing",
    desc: "Reportes mensuales con el rendimiento de cada canal y recomendaciones automáticas para optimizar la inversión.",
  },
];

export default function Marketing() {
  const [selectedTab, setSelectedTab] = useState("marketing");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const notifyEmail = email || user?.email || "";
    if (!notifyEmail) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/notify-waitlist", { email: notifyEmail, module: "marketing" });
    } catch (_) {
      // fail silently — endpoint may not exist yet
    } finally {
      setLoading(false);
      setSubmitted(true);
      toast({ title: "¡Anotado!", description: "Te avisaremos cuando el módulo de Marketing esté disponible." });
    }
  };

  return (
    <div className="flex h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#e6f4f1", color: "#0D7C66", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0D7C66", display: "inline-block" }} />
              Próximamente
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: "-.02em", marginBottom: 10 }}>
              Módulo de Marketing
            </h1>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 600, lineHeight: 1.65 }}>
              Herramientas de captación y publicidad integradas en tu plataforma de certificación. Atrae más clientes sin salir de CERTIFIVE.
            </p>
          </div>

          {/* Features grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "24px 20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(226,232,240,.25) 8px, rgba(226,232,240,.25) 9px)", pointerEvents: "none" }} />
                  <div style={{ width: 36, height: 36, background: "#e6f4f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <Icon size={18} color="#0D7C66" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{f.title}</div>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</p>
                  <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", background: "#F1F5F9", color: "#94A3B8", padding: "2px 7px", borderRadius: 3 }}>
                    Pronto
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notify CTA */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "40px 48px", textAlign: "center" }}>
            {submitted ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, background: "#e6f4f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={24} color="#0D7C66" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>¡Estás en la lista!</div>
                <p style={{ fontSize: 14, color: "#64748B", maxWidth: 380 }}>
                  Te notificaremos en cuanto el módulo de Marketing esté disponible. Serás de los primeros en acceder.
                </p>
              </div>
            ) : (
              <>
                <div style={{ width: 48, height: 48, background: "#e6f4f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Bell size={22} color="#0D7C66" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
                  Avísame cuando esté disponible
                </h2>
                <p style={{ fontSize: 14, color: "#64748B", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
                  El módulo de Marketing está en desarrollo activo. Déjanos tu email y serás el primero en saber cuándo se lanza.
                </p>
                <form onSubmit={handleNotify} style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                      type="email"
                      placeholder={user?.email || "tu@email.com"}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ width: "100%", height: 40, paddingLeft: 34, paddingRight: 12, border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 13, color: "#0F172A", outline: "none", background: "#F8FAFC", boxSizing: "border-box" }}
                      onFocus={e => (e.target.style.borderColor = "#0D7C66")}
                      onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: "0 20px", height: 40, background: "#0D7C66", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? .7 : 1, transition: "background .15s" }}
                    onMouseOver={e => (e.currentTarget.style.background = "#0a6454")}
                    onMouseOut={e => (e.currentTarget.style.background = "#0D7C66")}
                  >
                    {loading ? "Enviando..." : "Avisarme"}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
