import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "certifive-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 20,
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "hsl(var(--border))",
        background: isDark ? "rgba(255,255,255,0.06)" : "hsl(var(--muted))",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 500,
        color: isDark ? "rgba(255,255,255,0.7)" : "hsl(var(--muted-foreground))",
        transition: "all 0.2s ease",
        userSelect: "none",
        flexShrink: 0,
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLElement).style.borderColor = isDark
          ? "rgba(255,255,255,0.22)"
          : "hsl(var(--ring))";
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLElement).style.borderColor = isDark
          ? "rgba(255,255,255,0.12)"
          : "hsl(var(--border))";
      }}
    >
      {isDark ? (
        <>
          <Sun style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span className="hidden sm:inline">Claro</span>
        </>
      ) : (
        <>
          <Moon style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span className="hidden sm:inline">Oscuro</span>
        </>
      )}
    </button>
  );
}
