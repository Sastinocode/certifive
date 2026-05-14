// @ts-nocheck
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/useIsMobile";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import OnboardingFlow from "./OnboardingFlow";
import Dashboard from "../pages/dashboard";
import Certifications from "../pages/Certifications";
import Properties from "../pages/properties";
import WhatsApp from "../pages/WhatsApp";
import Invoices from "../pages/Invoices";
import Marketing from "../pages/marketing";
import Settings from "../pages/settings";

type Page = "dashboard" | "certifications" | "properties" | "whatsapp" | "invoices" | "marketing" | "settings";

const navItems = [
  { id: "dashboard",      label: "Dashboard",      icon: "dashboard"     },
  { id: "certifications", label: "Certificados",   icon: "verified"      },
  { id: "properties",     label: "Propiedades",    icon: "home_work"     },
  { id: "whatsapp",       label: "WhatsApp",       icon: "chat"          },
  { id: "invoices",       label: "Facturas",       icon: "receipt_long"  },
  { id: "marketing",      label: "Marketing",      icon: "campaign"      },
  { id: "settings",       label: "Configuración",  icon: "settings"      },
] as const;

export default function Layout() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const showOnboarding = !onboardingDone && user && user.onboardingCompleted === false;

  const navigate = (p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":      return <Dashboard onNavigate={navigate} />;
      case "certifications": return <Certifications />;
      case "properties":     return <Properties />;
      case "whatsapp":       return <WhatsApp />;
      case "invoices":       return <Invoices />;
      case "marketing":      return <Marketing />;
      case "settings":       return <Settings />;
    }
  };

  const initials = (user?.name || user?.username || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentLabel = navItems.find(n => n.id === page)?.label ?? "";

  if (showOnboarding && user) {
    return <OnboardingFlow user={user} onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `} style={{ background: "#fff", borderRight: "1px solid #E2E8F0" }}>

        {/* Logo */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#0D7C66", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", letterSpacing: "-.01em", lineHeight: 1.2 }}>CERTIFIVE</div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", marginTop: 1 }}>Certificación CEE</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#94A3B8", padding: "0 10px", marginBottom: 8 }}>Menú principal</div>
          {navItems.map(item => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => navigate(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: isActive ? 600 : 500, textAlign: "left",
                  transition: "all .15s",
                  background: isActive ? "#0D7C66" : "transparent",
                  color: isActive ? "#fff" : "#334155",
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "#F1F5F9"; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, opacity: isActive ? 1 : 0.7, fontVariationSettings: isActive ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.id === "marketing" && (
                  <span style={{ marginLeft: "auto", fontSize: 9, background: "#e6f4f1", color: "#0D7C66", padding: "2px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: ".04em" }}>NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* CTA */}
        <div style={{ padding: "0 12px 12px" }}>
          <button
            data-testid="btn-nuevo-certificado"
            onClick={() => navigate("certifications")}
            style={{ width: "100%", background: "#0D7C66", color: "#fff", border: "none", borderRadius: 6, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s" }}
            onMouseOver={e => (e.currentTarget.style.background = "#0a6454")}
            onMouseOut={e => (e.currentTarget.style.background = "#0D7C66")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
            Nuevo Certificado
          </button>
        </div>

        {/* User footer */}
        <div style={{ borderTop: "1px solid #E2E8F0", padding: "12px 12px 16px" }}>
          <button
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", marginBottom: 4, fontSize: 13, color: "#64748B", transition: "background .15s" }}
            onMouseOver={e => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, opacity: .6 }}>help</span>
            <span>Centro de ayuda</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: "#F8FAFC" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0D7C66", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || user?.username}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Certificador</div>
            </div>
            <button
              data-testid="btn-logout"
              onClick={logout}
              title="Cerrar sesión"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, borderRadius: 4, display: "flex", alignItems: "center", transition: "color .15s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#334155")}
              onMouseOut={e => (e.currentTarget.style.color = "#94A3B8")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, position: "sticky", top: 0, zIndex: 20 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: "6px", borderRadius: 6, display: "flex", alignItems: "center" }}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", letterSpacing: "-.01em", margin: 0 }}>{currentLabel}</h2>
          </div>

          <div className="hidden md:flex" style={{ alignItems: "center", background: "#F8FAFC", borderRadius: 6, padding: "6px 12px", gap: 8, border: "1px solid #E2E8F0", width: 192 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#94A3B8" }}>search</span>
            <input
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#0F172A", width: "100%" }}
              placeholder="Buscar..."
            />
          </div>

          <NotificationBell onNavigate={navigate} />

          <button
            data-testid="btn-settings"
            onClick={() => navigate("settings")}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "#0D7C66", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}
            onMouseOver={e => (e.currentTarget.style.background = "#0a6454")}
            onMouseOut={e => (e.currentTarget.style.background = "#0D7C66")}
            aria-label="Configuración"
          >
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{initials}</span>
          </button>
        </header>

        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: isMobile ? "calc(3.5rem + env(safe-area-inset-bottom))" : undefined }}
        >
          {renderPage()}
        </main>
      </div>

      {isMobile && <BottomNav page={page} onNavigate={navigate} />}
    </div>
  );
}
