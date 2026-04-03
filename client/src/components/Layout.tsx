import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "../pages/Dashboard";
import Certifications from "../pages/Certifications";
import Properties from "../pages/Properties";
import WhatsApp from "../pages/WhatsApp";
import Invoices from "../pages/Invoices";
import Marketing from "../pages/Marketing";
import Settings from "../pages/Settings";

type Page = "dashboard" | "certifications" | "properties" | "whatsapp" | "invoices" | "marketing" | "settings";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "certifications", label: "Certificados", icon: "verified" },
  { id: "properties", label: "Propiedades", icon: "home_work" },
  { id: "whatsapp", label: "WhatsApp", icon: "chat" },
  { id: "invoices", label: "Facturas", icon: "receipt_long" },
  { id: "marketing", label: "Marketing", icon: "campaign" },
  { id: "settings", label: "Configuración", icon: "settings" },
] as const;

export default function Layout() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "certifications": return <Certifications />;
      case "properties": return <Properties />;
      case "whatsapp": return <WhatsApp />;
      case "invoices": return <Invoices />;
      case "marketing": return <Marketing />;
      case "settings": return <Settings />;
    }
  };

  const initials = (user?.name || user?.username || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen bg-emerald-50/40 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-emerald-50 flex flex-col p-6 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} border-r border-emerald-100`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="material-symbols-outlined text-white text-[18px]">energy_savings_leaf</span>
          </div>
          <div>
            <span className="text-base font-bold text-emerald-900 leading-tight block">CERTIFIVE</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700/60">Certificación CEE v1.0</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-800/50 mb-3 px-2">Menú principal</p>
          {navItems.map(item => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-white text-orange-700 shadow-sm"
                    : "text-emerald-800/60 hover:bg-emerald-100 hover:text-emerald-900"
                }`}
              >
                <span className={isActive ? "material-symbols-filled" : "material-symbols-outlined"} style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24", fontFamily: "'Material Symbols Outlined'" } : {}}>
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

        <div className="mt-4">
          <button
            data-testid="btn-nuevo-certificado"
            onClick={() => setPage("certifications")}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-[0.98] transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Nuevo Certificado
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-emerald-100 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-800/60 hover:bg-emerald-100 rounded-xl transition-all text-[11px] font-semibold uppercase tracking-wider">
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
              className="text-emerald-900/40 hover:text-emerald-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100/60 px-8 py-5 flex items-center gap-4 flex-shrink-0 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-emerald-700 hover:bg-emerald-100 p-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-emerald-900 tracking-tight">
              {navItems.find(n => n.id === page)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:flex items-center bg-emerald-50 rounded-full px-4 py-2.5 w-56 gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-emerald-500/70 outline-none"
                placeholder="Buscar..."
              />
            </div>
            <button
              data-testid="btn-settings"
              onClick={() => setPage("settings")}
              className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 transition-colors"
            >
              <span className="text-white font-bold text-sm">{initials}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
