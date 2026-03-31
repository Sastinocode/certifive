import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "../pages/Dashboard";
import Certifications from "../pages/Certifications";
import Properties from "../pages/Properties";
import WhatsApp from "../pages/WhatsApp";
import Invoices from "../pages/Invoices";
import Marketing from "../pages/Marketing";
import Automatizaciones from "../pages/Automatizaciones";
import Settings from "../pages/Settings";

type Page = "dashboard" | "certifications" | "properties" | "whatsapp" | "invoices" | "marketing" | "automatizaciones" | "settings";

const navItems = [
  { id: "dashboard", label: "Panel", icon: "📊" },
  { id: "certifications", label: "Certificados", icon: "📋" },
  { id: "properties", label: "Propiedades", icon: "🏠" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "invoices", label: "Facturas", icon: "🧾" },
  { id: "marketing", label: "Marketing", icon: "📣" },
  { id: "automatizaciones", label: "Automatizaciones", icon: "🤖" },
  { id: "settings", label: "Configuración", icon: "⚙️" },
] as const;

export default function Layout() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "certifications": return <Certifications />;
      case "properties": return <Properties />;
      case "whatsapp": return <WhatsApp />;
      case "invoices": return <Invoices />;
      case "marketing": return <Marketing />;
      case "automatizaciones": return <Automatizaciones />;
      case "settings": return <Settings />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-sidebar flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "hsl(var(--sidebar-background))" }}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-black text-sm">C5</span>
          </div>
          <span className="text-white font-bold text-lg">CERTIFIVE</span>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-colors ${
                page === item.id
                  ? "bg-teal-500/20 text-teal-400"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {(item.id === "marketing" || item.id === "automatizaciones") && (
                <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">Nuevo</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || user?.username}</p>
              <p className="text-white/40 text-xs truncate">{user?.email || "Certificador"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-white/50 hover:text-white text-xs py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {navItems.find(n => n.id === page)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage("settings")}
              className="w-9 h-9 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <span className="text-white font-bold text-sm">
                {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
              </span>
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
