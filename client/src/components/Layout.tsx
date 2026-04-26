import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/useIsMobile";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import OnboardingFlow from "./OnboardingFlow";
import Dashboard from "../pages/Dashboard";
import Certifications from "../pages/Certifications";
import Properties from "../pages/Properties";
import WhatsApp from "../pages/WhatsApp";
import Invoices from "../pages/Invoices";
import Marketing from "../pages/Marketing";
import Settings from "../pages/Settings";

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

  // Show onboarding if user hasn't completed it yet (and hasn't dismissed this session)
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

  // ── Onboarding overlay ─────────────────────────────────────────────────────
  if (showOnboarding && user) {
    return (
      <OnboardingFlow
        user={user}
        onComplete={() => setOnboardingDone(true)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-emerald-50/40 overflow-hidden">

      {/* ── Overlay (mobile sidebar) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop always visible / mobile slide-in) ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-emerald-50 flex flex-col p-6
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          border-r border-emerald-100
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="material-symbols-outlined text-white text-[18px]">energy_savings_leaf</span>
          </div>
          <div>
            <span className="text-base font-bold text-emerald-900 leading-tight block">CERTIFIVE</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700/60">Certificación CEE v1.0</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-800/50 mb-3 px-2">Menú principal</p>
          {navItems.map(item => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all min-h-[44px] ${
                  isActive
                    ? "bg-white text-orange-700 shadow-sm"
                    : "text-emerald-800/60 hover:bg-emerald-100 hover:text-emerald-900"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.id === "marketing" && (
                  <span className="ml-auto text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="mt-4">
          <button
            data-testid="btn-nuevo-certificado"
            onClick={() => navigate("certifications")}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-[0.98] transition-all text-sm min-h-[52px]"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Nuevo Certificado
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-emerald-100 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-800/60 hover:bg-emerald-100 rounded-xl transition-all text-[11px] font-semibold uppercase tracking-wider min-h-[44px]">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span>Centro de ayuda</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-emerald-100/40 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-900 truncate">{user?.name || user?.username}</p>
              <p className="text-[10px] text-emerald-700/60 truncate">{user?.email || "Certificador energético"}</p>
            </div>
            <button
              data-testid="btn-logout"
              onClick={logout}
              title="Cerrar sesión"
              className="text-emerald-900/40 hover:text-emerald-900 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100/60 px-4 sm:px-8 py-4 flex items-center gap-3 flex-shrink-0 sticky top-0 z-20">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-emerald-700 hover:bg-emerald-100 p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-900 tracking-tight truncate">
              {currentLabel}
            </h2>
          </div>

          {/* Search (hidden on small screens to save space) */}
          <div className="relative hidden md:flex items-center bg-emerald-50 rounded-full px-4 py-2 w-48 gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-[18px]">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-emerald-500/70 outline-none"
              placeholder="Buscar..."
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Notification bell */}
          <NotificationBell onNavigate={navigate} />

          {/* Avatar → settings */}
          <button
            data-testid="btn-settings"
            onClick={() => navigate("settings")}
            className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 transition-colors flex-shrink-0"
            aria-label="Configuración"
          >
            <span className="text-white font-bold text-sm">{initials}</span>
          </button>
        </header>

        {/* Scrollable page content */}
        {/* On mobile add padding-bottom so content clears the BottomNav */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: isMobile ? "calc(3.5rem + env(safe-area-inset-bottom))" : undefined }}
        >
          {renderPage()}
        </main>
      </div>

      {/* ── Bottom Nav (mobile only) ── */}
      {isMobile && <BottomNav page={page} onNavigate={navigate} />}
    </div>
  );
}
