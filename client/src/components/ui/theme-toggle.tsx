import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("certifive-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("certifive-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      style={{
        width: 36, height: 36, borderRadius: 8, border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
        background: isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all .2s", flexShrink: 0,
        color: isDark ? "#94A3B8" : "#64748B",
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}