import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "certifive-theme";

// Aplica el tema INMEDIATAMENTE al cargar el módulo, antes de que React renderice
// Esto evita el flash de tema incorrecto
function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
}

function getInitialDark(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved === "dark";
  return true; // Por defecto oscuro — mismo estilo que el sidebar
}

// Aplica el tema al cargar la página
if (typeof window !== "undefined") {
  applyTheme(getInitialDark());
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialDark);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all select-none"
      style={{
        background: isDark ? "rgba(255,255,255,0.07)" : "hsl(var(--muted))",
        borderColor: isDark ? "rgba(255,255,255,0.14)" : "hsl(var(--border))",
        color: isDark ? "rgba(255,255,255,0.65)" : "hsl(var(--muted-foreground))",
      }}
    >
      {isDark
        ? <><Sun className="w-3.5 h-3.5" /><span className="hidden sm:inline">Claro</span></>
        : <><Moon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Oscuro</span></>
      }
    </button>
  );
}
