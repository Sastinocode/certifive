import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, FileText, Award, Receipt,
  MessageCircle, BarChart2, Settings, LogOut,
  HelpCircle, Plus, Search, Crown, Sparkles,
} from "lucide-react";

type Feature = "whatsapp" | "reports" | "invoicing" | "multi_user";

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

// 8 ítems del handoff (panel interno). Mapeados a las rutas reales (wouter).
const allItems: { id: string; label: string; icon: React.ElementType; path: string; requiredFeature?: Feature; requiredBadge?: string }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard, path: "/" },
  { id: "inmuebles",    label: "Inmuebles",    icon: Building2,       path: "/propiedades" },
  { id: "expedientes",  label: "Expedientes",  icon: FileText,        path: "/certificados" },
  { id: "certificados", label: "Certificados", icon: Award,          path: "/certificados/nuevo" },
  { id: "facturacion",  label: "Facturación",  icon: Receipt,        path: "/facturacion", requiredFeature: "invoicing", requiredBadge: "Pro" },
  { id: "whatsapp",     label: "WhatsApp",     icon: MessageCircle,  path: "/whatsapp",    requiredFeature: "whatsapp",  requiredBadge: "Pro" },
  { id: "informes",     label: "Informes",     icon: BarChart2,      path: "/informes",    requiredFeature: "reports",   requiredBadge: "Pro" },
  { id: "ajustes",      label: "Ajustes",      icon: Settings,       path: "/configuracion" },
];

const sections = [
  { label: "Principal",    ids: ["dashboard", "inmuebles", "expedientes", "certificados"] },
  { label: "Comunicación", ids: ["whatsapp"] },
  { label: "Negocio",      ids: ["facturacion", "informes"] },
  { label: "Sistema",      ids: ["ajustes"] },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Plan Gratuito",
  basico: "Plan Básico",
  pay_per_use: "Pay per use",
  profesional: "Plan Pro",
  pro: "Plan Pro",
  empresa: "Plan Empresa",
  enterprise: "Plan Enterprise",
};

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const { canUse, plan } = usePlanFeatures();
  const [location, setLocation] = useLocation();

  const handleLogout = () => { window.location.href = "/api/logout"; };

  const initials = (user?.firstName && user?.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : ((user as any)?.email?.[0] || "U").toUpperCase();

  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : (user as any)?.email || "Usuario";

  const planLabel = PLAN_LABELS[plan] ?? "Plan Gratuito";
  const showUpgrade = plan === "free" || plan === "basico";
  const isPaidPlan = !showUpgrade;

  const isLocked = (item: (typeof allItems)[0]) =>
    !!item.requiredFeature && !canUse(item.requiredFeature);

  // Resaltado por ruta de wouter: gana la coincidencia más específica
  // (p. ej. /certificados/nuevo prevalece sobre /certificados).
  const score = (p: string) => {
    if (p === "/") return location === "/" ? 1 : 0;
    if (location === p) return p.length + 1;
    return location.startsWith(p + "/") ? p.length : 0;
  };
  const bestPath = allItems.reduce(
    (best, it) => (score(it.path) > best.s ? { path: it.path, s: score(it.path) } : best),
    { path: "", s: 0 },
  );
  const isActive = (item: (typeof allItems)[0]) =>
    bestPath.s > 0 ? item.path === bestPath.path : selectedTab === item.id;

  const navigate = (item: (typeof allItems)[0]) => {
    if (isLocked(item)) return;
    setLocation(item.path);
    onTabChange(item.id);
  };

  return (
    <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 h-screen bg-sidebar text-sidebar-foreground">
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-sidebar-border flex-shrink-0">
        <svg width="130" height="34" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 17L6 28L22 28L22 17L14 9Z" fill="none" stroke="#1FA94B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          <rect x="9" y="22" width="2.5" height="6" rx="0.5" fill="#1FA94B"/>
          <rect x="13" y="19" width="2.5" height="9" rx="0.5" fill="#84CC16"/>
          <rect x="17" y="16" width="2.5" height="12" rx="0.5" fill="#F59E0B"/>
          <text x="30" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="19" fill="white">certifive</text>
        </svg>
        <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-sidebar-foreground/40 mt-1">
          Certificación Energética
        </p>
      </div>

      {/* ── CTAs: nuevo + búsqueda ────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1 flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={() => navigate(allItems.find(i => i.id === "certificados")!)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Nuevo Certificado
        </button>

        <button
          onClick={() => (window as any).__openGlobalSearch?.()}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 border border-sidebar-foreground/10 text-sidebar-foreground/50 transition-colors"
        >
          <Search size={13} className="flex-shrink-0" />
          <span className="flex-1 text-left">Buscar…</span>
          <span className="flex items-center gap-[3px]">
            <kbd className="text-[10px] rounded-[3px] px-[5px] py-px border border-sidebar-foreground/15 text-sidebar-foreground/30 bg-sidebar-foreground/5">Ctrl</kbd>
            <kbd className="text-[10px] rounded-[3px] px-[5px] py-px border border-sidebar-foreground/15 text-sidebar-foreground/30 bg-sidebar-foreground/5">K</kbd>
          </span>
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && <div className="mx-0.5 my-2.5 border-t border-sidebar-border" />}
            <p className={cn(
              "text-[10px] font-semibold tracking-[0.08em] uppercase text-sidebar-foreground/40 px-2.5 mb-1",
              si > 0 ? "mt-2" : "mt-1",
            )}>
              {section.label}
            </p>

            {allItems
              .filter(item => section.ids.includes(item.id))
              .map(item => {
                const locked = isLocked(item);
                const active = !locked && isActive(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item)}
                    disabled={locked}
                    className={cn(
                      "w-full relative flex items-center gap-2.5 rounded-lg pl-3.5 pr-3 py-2.5 text-[13px] text-left mb-px transition-colors",
                      active
                        ? "bg-primary/15 text-sidebar-foreground font-medium"
                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent",
                      locked && "opacity-50 cursor-default hover:bg-transparent",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-primary" />
                    )}
                    <Icon
                      size={16}
                      className={cn("flex-shrink-0", active ? "text-primary" : "opacity-55")}
                    />
                    <span className="flex-1">{item.label}</span>
                    {locked && item.requiredBadge && (
                      <span className="text-[9px] font-bold tracking-[0.04em] rounded px-[5px] py-px flex-shrink-0 text-amber-400 bg-amber-400/15 border border-amber-400/30">
                        {item.requiredBadge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border px-2.5 pt-2.5 pb-3.5 flex-shrink-0">
        {/* Plan indicator */}
        {isPaidPlan ? (
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-2 bg-primary/10 border border-primary/20">
            <Crown size={12} className="text-primary" />
            <span className="text-[11px] font-semibold text-primary">{planLabel}</span>
            <span className="text-[10px] text-sidebar-foreground/40 ml-auto">Activo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-2 bg-sidebar-foreground/5 border border-sidebar-foreground/10">
            <Sparkles size={12} className="text-sidebar-foreground/40" />
            <span className="text-[11px] font-medium text-sidebar-foreground/40">{planLabel}</span>
            <button
              onClick={() => setLocation("/configuracion#planes")}
              className="ml-auto text-[10px] font-semibold text-primary hover:opacity-75 transition-opacity"
            >
              Mejorar →
            </button>
          </div>
        )}

        {/* Help */}
        <button className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 mb-1.5 text-xs text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <HelpCircle size={14} className="opacity-65" />
          <span>Centro de ayuda</span>
        </button>

        {/* User row */}
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 bg-sidebar-foreground/5">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-sidebar-foreground/40">Certificador</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors flex items-center"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
