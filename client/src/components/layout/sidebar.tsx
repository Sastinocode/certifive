import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  LayoutDashboard, FileText, Users, Award, ClipboardList,
  MessageCircle, Receipt, BarChart2, Settings, LogOut,
  HelpCircle, Plus, Search, Crown, Sparkles,
} from "lucide-react";

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

// Fixed dark palette — sidebar stays dark regardless of light/dark mode toggle
const BG      = "#0F1923";
const HOVER   = "#1a2632";
const ACTIVE  = "#1FA94B";
const BORDER  = "rgba(255,255,255,0.07)";
const TEXT    = "rgba(255,255,255,0.82)";
const DIM     = "rgba(255,255,255,0.38)";

const allItems = [
  { id: "dashboard",     label: "Dashboard",     icon: LayoutDashboard, path: "/" },
  { id: "expedientes",   label: "Expedientes",   icon: FileText,        path: "/certificados" },
  { id: "clientes",      label: "Clientes",      icon: Users,           path: "/propiedades" },
  { id: "certificados",  label: "Certificados",  icon: Award,           path: "/certificados" },
  { id: "cuestionarios", label: "Cuestionarios", icon: ClipboardList,   path: "/formulario-cee" },
  { id: "whatsapp",      label: "WhatsApp",       icon: MessageCircle,   path: "/whatsapp" },
  { id: "facturacion",   label: "Facturación",   icon: Receipt,         path: "/tarifas" },
  { id: "informes",      label: "Informes",      icon: BarChart2,       path: "/informes" },
  { id: "settings",      label: "Configuración", icon: Settings,        path: "/configuracion" },
];

const sections = [
  { label: "Principal",    ids: ["dashboard", "expedientes", "clientes", "certificados", "cuestionarios"] },
  { label: "Comunicación", ids: ["whatsapp"] },
  { label: "Negocio",      ids: ["facturacion", "informes"] },
  { label: "Sistema",      ids: ["settings"] },
];

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => { window.location.href = "/api/logout"; };

  const initials = (user?.firstName && user?.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : ((user as any)?.email?.[0] || "U").toUpperCase();

  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : (user as any)?.email || "Usuario";

  // Graceful fallback — shows "Gratuito" until a plan field is confirmed
  const isPro = !!(user as any)?.isPro || (user as any)?.plan === "pro";

  const isActive = (item: (typeof allItems)[0]) =>
    location === item.path || selectedTab === item.id;

  const navigate = (item: (typeof allItems)[0]) => {
    setLocation(item.path);
    onTabChange(item.id);
  };

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0"
      style={{ width: 240, background: BG, height: "100vh" }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <svg width="130" height="34" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 17L6 28L22 28L22 17L14 9Z" fill="none" stroke="#1FA94B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          <rect x="9" y="22" width="2.5" height="6" rx="0.5" fill="#1FA94B"/>
          <rect x="13" y="19" width="2.5" height="9" rx="0.5" fill="#84CC16"/>
          <rect x="17" y="16" width="2.5" height="12" rx="0.5" fill="#F59E0B"/>
          <text x="30" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="19" fill="white">certifive</text>
        </svg>
        <p style={{ fontSize: 10, color: DIM, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", marginTop: 4 }}>
          Certificación Energética
        </p>
      </div>

      {/* ── CTAs: nuevo + búsqueda ────────────────────────────────────────── */}
      <div style={{ padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => navigate(allItems.find(i => i.id === "certificados")!)}
          style={{
            width: "100%", background: ACTIVE, color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, transition: "background .15s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = "#178A3C")}
          onMouseOut={e => (e.currentTarget.style.background = ACTIVE)}
        >
          <Plus size={15} />
          Nuevo Certificado
        </button>

        <button
          onClick={() => (window as any).__openGlobalSearch?.()}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.48)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 8, padding: "8px 12px", fontSize: 12,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            transition: "background .15s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
          onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        >
          <Search size={13} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: "left" }}>Buscar…</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <kbd style={{
              fontSize: 10, border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 3, padding: "1px 5px", fontFamily: "inherit",
              color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.05)",
            }}>
              Ctrl
            </kbd>
            <kbd style={{
              fontSize: 10, border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 3, padding: "1px 5px", fontFamily: "inherit",
              color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.05)",
            }}>
              K
            </kbd>
          </span>
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && (
              <div style={{ margin: "10px 2px", borderTop: `1px solid ${BORDER}` }} />
            )}
            <p style={{
              fontSize: 10, fontWeight: 600, letterSpacing: ".08em",
              textTransform: "uppercase", color: DIM,
              padding: "0 10px", marginBottom: 4, marginTop: si > 0 ? 8 : 4,
            }}>
              {section.label}
            </p>

            {allItems
              .filter(item => section.ids.includes(item.id))
              .map(item => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item)}
                    style={{
                      width: "100%", position: "relative",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px 9px 14px",
                      borderRadius: 8, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      textAlign: "left", marginBottom: 1,
                      background: active ? "rgba(31,169,75,0.14)" : "transparent",
                      color: active ? "#1FA94B" : TEXT,
                      transition: "background .12s, color .12s",
                    }}
                    onMouseOver={e => { if (!active) e.currentTarget.style.background = HOVER; }}
                    onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Left accent bar for active item */}
                    {active && (
                      <span style={{
                        position: "absolute", left: 0,
                        top: "50%", transform: "translateY(-50%)",
                        width: 3, height: 20,
                        background: "#1FA94B",
                        borderRadius: "0 3px 3px 0",
                      }} />
                    )}
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: active ? "#1FA94B" : TEXT,
                        opacity: active ? 1 : 0.55,
                      }}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "10px 10px 14px", flexShrink: 0 }}>

        {/* Plan indicator */}
        {isPro ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 10px", borderRadius: 8, marginBottom: 8,
            background: "rgba(31,169,75,0.12)",
            border: "1px solid rgba(31,169,75,0.22)",
          }}>
            <Crown size={12} color="#1FA94B" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#1FA94B" }}>Plan Pro</span>
            <span style={{ fontSize: 10, color: DIM, marginLeft: "auto" }}>Activo</span>
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 10px", borderRadius: 8, marginBottom: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <Sparkles size={12} color={DIM} />
            <span style={{ fontSize: 11, fontWeight: 500, color: DIM }}>Plan Gratuito</span>
            <button
              style={{
                marginLeft: "auto", fontSize: 10, color: ACTIVE,
                background: "none", border: "none", cursor: "pointer",
                fontWeight: 600, padding: 0,
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.75")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Mejorar →
            </button>
          </div>
        )}

        {/* Help */}
        <button
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "7px 10px", borderRadius: 6, border: "none",
            background: "transparent", cursor: "pointer", marginBottom: 6,
            fontSize: 12, color: DIM, transition: "background .15s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = HOVER)}
          onMouseOut={e => (e.currentTarget.style.background = "transparent")}
        >
          <HelpCircle size={14} style={{ opacity: 0.65 }} />
          <span>Centro de ayuda</span>
        </button>

        {/* User row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: ACTIVE, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: TEXT,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {displayName}
            </p>
            <p style={{ fontSize: 11, color: DIM }}>Certificador</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: DIM, padding: 4, borderRadius: 4,
              display: "flex", alignItems: "center", transition: "color .15s",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#fff")}
            onMouseOut={e => (e.currentTarget.style.color = DIM)}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
