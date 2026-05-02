import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Home, 
  IdCard, 
  Building, 
  BarChart, 
  Settings, 
  User,
  LogOut,
  Euro,
  MessageCircle,
  Menu,
  ChevronLeft,
  CreditCard,
  TrendingUp,
  Bot,
  HelpCircle,
  Plus
} from "lucide-react";

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { id: "dashboard",    label: "Dashboard",         icon: Home,        path: "/" },
    { id: "whatsapp",     label: "Clientes WhatsApp", icon: MessageCircle, path: "/whatsapp" },
    { id: "certificates", label: "Certificados",      icon: IdCard,      path: "/certificados" },
    { id: "properties",   label: "Propiedades",       icon: Building,    path: "/propiedades" },
    { id: "pricing",      label: "Tarifas",           icon: Euro,        path: "/tarifas" },
    { id: "reports",      label: "Informes",          icon: BarChart,    path: "/informes" },
    { id: "marketing",    label: "Marketing",         icon: TrendingUp,  path: "/marketing", badge: "NEW" },
    { id: "automations",  label: "Automatizaciones",  icon: Bot,         path: "/automatizaciones" },
    { id: "stripe",       label: "Pagos Stripe",      icon: CreditCard,  path: "/stripe" },
    { id: "settings",     label: "Configuración",     icon: Settings,    path: "/configuracion" },
  ];

  const initials = (user?.firstName && user?.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "Usuario";

  return (
    <div
      className={`hidden lg:flex lg:flex-col transition-all duration-300 ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}`}
      style={{ flexShrink: 0 }}
    >
      <div
        className="flex flex-col flex-grow overflow-y-auto"
        style={{ background: "#fff", borderRight: "1px solid #E2E8F0" }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex", alignItems: "center", padding: isCollapsed ? "16px 0" : "16px 20px",
            justifyContent: isCollapsed ? "center" : "space-between",
            borderBottom: "1px solid #E2E8F0", flexShrink: 0, minHeight: 64,
          }}
        >
          {!isCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase" }}>Certificación CEE</div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div style={{ width: 28, height: 28, background: "#0D7C66", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <button
              onClick={() => setIsCollapsed(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }}
            >
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: isCollapsed ? "12px 8px" : "16px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {!isCollapsed && (
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#94A3B8", padding: "0 10px", marginBottom: 8 }}>
              Menú principal
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || selectedTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setLocation(item.path);
                  onTabChange(item.id);
                }}
                title={isCollapsed ? item.label : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: isCollapsed ? 0 : 10,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  padding: isCollapsed ? "10px 0" : "9px 12px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  transition: "all .15s",
                  background: isActive ? "#0D7C66" : "transparent",
                  color: isActive ? "#fff" : "#334155",
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "#F1F5F9"; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.65 }} />
                {!isCollapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span style={{ fontSize: 9, background: "#e6f4f1", color: "#0D7C66", padding: "2px 5px", borderRadius: 3, fontWeight: 700, letterSpacing: ".04em" }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* New cert CTA */}
        {!isCollapsed && (
          <div style={{ padding: "0 12px 12px" }}>
            <button
              onClick={() => { setLocation("/certificados"); onTabChange("certificates"); }}
              style={{ width: "100%", background: "#0D7C66", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s" }}
              onMouseOver={e => (e.currentTarget.style.background = "#0a6454")}
              onMouseOut={e => (e.currentTarget.style.background = "#0D7C66")}
            >
              <Plus size={15} />
              Nuevo Certificado
            </button>
          </div>
        )}

        {/* User footer */}
        <div style={{ borderTop: "1px solid #E2E8F0", padding: isCollapsed ? "12px 8px" : "12px 12px 16px" }}>
          {!isCollapsed && (
            <button
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", marginBottom: 4, fontSize: 13, color: "#64748B", transition: "background .15s" }}
              onMouseOver={e => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              <HelpCircle size={15} style={{ opacity: .6 }} />
              <span>Centro de ayuda</span>
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: isCollapsed ? 0 : 10, padding: isCollapsed ? "8px 0" : "8px 10px", justifyContent: isCollapsed ? "center" : "flex-start", borderRadius: 6, background: isCollapsed ? "transparent" : "#F8FAFC" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0D7C66", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{initials}</span>
            </div>
            {!isCollapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>Certificador</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, borderRadius: 4, display: "flex", alignItems: "center", transition: "color .15s" }}
                  onMouseOver={e => (e.currentTarget.style.color = "#334155")}
                  onMouseOut={e => (e.currentTarget.style.color = "#94A3B8")}
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
