/**
 * BottomNav — Fixed bottom navigation for mobile (< lg breakpoint).
 * Shows 4 primary destinations. The "Nueva cert." tab opens the Certifications
 * page via the same onNavigate prop used by the rest of the app.
 */
type Page = "dashboard" | "certifications" | "properties" | "whatsapp" | "invoices" | "marketing" | "settings";

interface BottomNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

const BOTTOM_ITEMS: { id: Page; label: string; icon: string; special?: boolean }[] = [
  { id: "dashboard",       label: "Inicio",    icon: "dashboard"   },
  { id: "certifications",  label: "Certs.",    icon: "verified"    },
  { id: "certifications",  label: "Nueva",     icon: "add_circle", special: true },
  { id: "properties",      label: "Clientes",  icon: "home_work"   },
  { id: "settings",        label: "Ajustes",   icon: "settings"    },
];

export default function BottomNav({ page, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        {BOTTOM_ITEMS.map((item, i) => {
          const isActive = !item.special && page === item.id;

          if (item.special) {
            return (
              <button
                key={`special-${i}`}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center -mt-5"
                aria-label="Nueva certificación"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-white text-[24px]">{item.icon}</span>
                </div>
                <span className="text-[9px] font-bold text-orange-600 mt-0.5 uppercase tracking-wide">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={`${item.id}-${i}`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 h-full min-w-[44px] transition-colors ${
                isActive ? "text-emerald-700" : "text-stone-400"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="material-symbols-outlined text-[22px] leading-none"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24", fontFamily: "'Material Symbols Outlined'" }
                    : {}
                }
              >
                {item.icon}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wide leading-none ${isActive ? "text-emerald-700" : "text-stone-400"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
