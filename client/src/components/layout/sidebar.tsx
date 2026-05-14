import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  LayoutDashboard, FileText, Users, Award, ClipboardList,
  MessageCircle, Receipt, BarChart2, Settings, LogOut,
  HelpCircle, Plus
} from "lucide-react";

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const BG      = "#0F1923";
const ACTIVE  = "#1FA94B";
const HOVER   = "#1a2632";
const TEXT    = "rgba(255,255,255,0.80)";
const DIM     = "rgba(255,255,255,0.40)";
const DIVIDER = "rgba(255,255,255,0.07)";

const allItems = [
  { id: "dashboard",     label: "Dashboard",     icon: LayoutDashboard, path: "/" },
  { id: "expedientes",   label: "Expedientes",   icon: FileText,        path: "/certificados" },
  { id: "clientes",      label: "Clientes",      icon: Users,           path: "/propiedades" },
  { id: "certificados",  label: "Certificados",  icon: Award,           path: "/certificados" },
  { id: "cuestionarios", label: "Cuestionarios", icon: ClipboardList,   path: "/formulario-cee" },
  { id: "whatsapp",      label: "WhatsApp",      icon: MessageCircle,   path: "/whatsapp" },
  { id: "facturacion",   label: "Facturación",   icon: Receipt,         path: "/tarifas" },
  { id: "informes",      label: "Informes",      icon: BarChart2,       path: "/informes" },
  { id: "settings",      label: "Configuración", icon: Settings,        path: "/configuracion" },
];

const sections = [
  { label: "Principal",     ids: ["dashboard", "expedientes", "clientes", "certificados", "cuestionarios"] },
  { label: "Comunicación",  ids: ["whatsapp"] },
  { label: "Negocio",       ids: ["facturacion", "informes"] },
  { label: "Sistema",       ids: ["settings"] },
];

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => { window.location.href = "/api/logout"; };

  const initials = (user?.firstName && user?.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "Usuario";

  const isActive = (item: typeof allItems[0]) =>
    location === item.path || selectedTab === item.id;

  return (
    <div className="hidden lg:flex lg:flex-col" style={{ width: 240, flexShrink: 0 }}>
      <div className="flex flex-col flex-grow overflow-y-auto" style={{ background: BG, height: "100vh" }}>

        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${DIVIDER}`, flexShrink: 0 }}>
          <svg width="130" height="34" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 17L6 28L22 28L22 17L14 9Z" fill="none" stroke="#1FA94B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
            <rect x="9" y="22" width="2.5" height="6" rx="0.5" fill="#1FA94B"/>
            <rect x="13" y="19" width="2.5" height="9" rx="0.5" fill="#84CC16"/>
            <rect x="17" y="16" width="2.5" height="12" rx="0.5" fill="#F59E0B"/>
            <text x="30" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="19" fill="white">certifive</text>
          </svg>
          <div style={{ fontSize: 10, color: DIM, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", marginTop: 4 }}>
            Certificación Energética
          </div>
        </div>

        {/* New cert CTA */}
        <div style={{ padding: "14px 12px 4px" }}>
          <button
            onClick={() => { setLocation("/certificados"); onTabChange("certificados"); }}
            style={{ width: "100%", background: ACTIVE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s" }}
            onMouseOver={e => (e.currentTarget.style.background = "#178A3C")}
            onMouseOut={e => (e.currentTarget.style.background = ACTIVE)}
          >
            <Plus size={15} />
            Nuevo Certificado
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          {sections.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div style={{ margin: "10px 2px", borderTop: `1px solid ${DIVIDER}` }} />}
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: DIM, padding: "0 10px", marginBottom: 4, marginTop: si > 0 ? 8 : 4 }}>
                {section.label}
              </div>
              {allItems
                .filter(item => section.ids.includes(item.id))
                .map(item => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setLocation(item.path); onTabChange(item.id); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
                        transition: "all .15s",
                        background: active ? ACTIVE : "transparent",
                        color: active ? "#fff" : TEXT,
                        marginBottom: 1,
                      }}
                      onMouseOver={e => { if (!active) e.currentTarget.style.background = HOVER; }}
                      onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Help + User footer */}
        <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: "10px 10px 16px" }}>
          <button
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", marginBottom: 6, fontSize: 12, color: DIM, transition: "background .15s" }}
            onMouseOver={e => (e.currentTarget.style.background = HOVER)}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}
          >
            <HelpCircle size={14} style={{ opacity: .7 }} />
            <span>Centro de ayuda</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: ACTIVE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 11, color: DIM }}>Certificador</div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{ background: "none", border: "none", cursor: "pointer", color: DIM, padding: 4, borderRadius: 4, display: "flex", alignItems: "center", transition: "color .15s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#fff")}
              onMouseOut={e => (e.currentTarget.style.color = DIM)}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
