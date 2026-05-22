import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, Users, Award, ClipboardList,
  MessageCircle, Receipt, BarChart2, Settings, Search,
  ArrowRight, Home, Folder, X,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface CertResult {
  id: number;
  label: string;
  sublabel: string;
  status: string;
  energyRating?: string;
  path: string;
  type: "certification";
}
interface FolderResult {
  id: number;
  label: string;
  sublabel: string;
  path: string;
  type: "folder";
}
interface PageResult {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: string;
}
interface SearchResponse {
  query: string;
  certifications: CertResult[];
  folders: FolderResult[];
  pages: PageResult[];
}

// ── Mapa de iconos de página ──────────────────────────────────────────────────
const PAGE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, FileText, Users, Award, ClipboardList,
  MessageCircle, Receipt, BarChart2, Settings,
};

// ── Colores por calificación CEE ──────────────────────────────────────────────
const RATING_COLORS: Record<string, string> = {
  A: "#22c55e", B: "#84cc16", C: "#eab308",
  D: "#f97316", E: "#ef4444", F: "#dc2626", G: "#991b1b",
};

// ── Colores por estado ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  "Nuevo":      "#6366f1",
  "En Proceso": "#f59e0b",
  "Finalizado": "#22c55e",
};

const BG     = "#0F1923";
const CARD   = "#162030";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT   = "rgba(255,255,255,0.85)";
const DIM    = "rgba(255,255,255,0.45)";
const ACTIVE = "#1FA94B";
const HOVER  = "rgba(255,255,255,0.06)";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery]       = useState("");
  const [cursor, setCursor]     = useState(0);
  const [, setLocation]         = useLocation();
  const inputRef                = useRef<HTMLInputElement>(null);
  const listRef                 = useRef<HTMLDivElement>(null);

  // ── Fetch con debounce ────────────────────────────────────────────────────
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ["/api/search", debouncedQ],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: open,
    staleTime: 10_000,
  });

  // ── Lista plana para navegación con teclado ───────────────────────────────
  type FlatItem =
    | { kind: "cert";   item: CertResult }
    | { kind: "folder"; item: FolderResult }
    | { kind: "page";   item: PageResult };

  const flat: FlatItem[] = [
    ...(data?.certifications ?? []).map(c => ({ kind: "cert" as const, item: c })),
    ...(data?.folders ?? []).map(f => ({ kind: "folder" as const, item: f })),
    ...(data?.pages ?? []).map(p => ({ kind: "page" as const, item: p })),
  ];

  // ── Resetear cursor cuando cambian resultados ─────────────────────────────
  useEffect(() => { setCursor(0); }, [debouncedQ]);

  // ── Focus al abrir ────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // ── Navegar ───────────────────────────────────────────────────────────────
  const navigate = useCallback((path: string) => {
    setLocation(path);
    onClose();
  }, [setLocation, onClose]);

  // ── Teclado ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     { onClose(); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && flat[cursor]) {
        navigate(flat[cursor].item.path);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, cursor, navigate, onClose]);

  // ── Scroll automático al item activo ─────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const hasCerts   = (data?.certifications?.length ?? 0) > 0;
  const hasFolders = (data?.folders?.length ?? 0) > 0;
  const hasPages   = (data?.pages?.length ?? 0) > 0;
  const isEmpty    = !hasCerts && !hasFolders && !hasPages && !isFetching;

  // índice acumulado para el cursor
  let idx = 0;

  return (
    // ── Overlay ──────────────────────────────────────────────────────────────
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.60)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 580,
          background: BG, border: `1px solid ${BORDER}`,
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
          maxHeight: "70vh",
        }}
      >
        {/* ── Input ──────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <Search size={18} style={{ color: DIM, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar expedientes, clientes, páginas..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 15, color: TEXT, fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: DIM, padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: 11, color: DIM, border: `1px solid ${BORDER}`,
            borderRadius: 4, padding: "2px 6px", fontFamily: "inherit", flexShrink: 0,
          }}>Esc</kbd>
        </div>

        {/* ── Resultados ─────────────────────────────────────────────────── */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>

          {/* Loading shimmer */}
          {isFetching && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: DIM, fontSize: 13 }}>
              Buscando…
            </div>
          )}

          {/* Sin resultados */}
          {!isFetching && isEmpty && debouncedQ && (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <Search size={32} style={{ color: DIM, marginBottom: 8, display: "block", margin: "0 auto 10px" }} />
              <div style={{ color: TEXT, fontSize: 14, fontWeight: 500 }}>Sin resultados para "{debouncedQ}"</div>
              <div style={{ color: DIM, fontSize: 12, marginTop: 4 }}>Prueba con nombre, dirección o referencia catastral</div>
            </div>
          )}

          {/* ── Expedientes ─────────────────────────────────────────────── */}
          {hasCerts && (
            <div>
              <SectionLabel label={query ? "Expedientes" : "Recientes"} />
              {data!.certifications.map(cert => {
                const i = idx++;
                return (
                  <ResultRow
                    key={`cert-${cert.id}`}
                    dataIdx={i}
                    active={cursor === i}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => navigate(cert.path)}
                    icon={<FileText size={15} />}
                    iconColor="#6366f1"
                    label={cert.label}
                    sublabel={cert.sublabel}
                    badge={cert.status}
                    badgeColor={STATUS_COLORS[cert.status] ?? "#6b7280"}
                    tag={cert.energyRating}
                    tagColor={RATING_COLORS[cert.energyRating ?? ""] ?? "#6b7280"}
                  />
                );
              })}
            </div>
          )}

          {/* ── Carpetas ────────────────────────────────────────────────── */}
          {hasFolders && (
            <div>
              <SectionLabel label="Carpetas" />
              {data!.folders.map(folder => {
                const i = idx++;
                return (
                  <ResultRow
                    key={`folder-${folder.id}`}
                    dataIdx={i}
                    active={cursor === i}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => navigate(folder.path)}
                    icon={<Folder size={15} />}
                    iconColor="#f59e0b"
                    label={folder.label}
                    sublabel={folder.sublabel}
                  />
                );
              })}
            </div>
          )}

          {/* ── Páginas ─────────────────────────────────────────────────── */}
          {hasPages && (
            <div>
              <SectionLabel label="Navegación" />
              {data!.pages.map(page => {
                const i = idx++;
                const Icon = PAGE_ICONS[page.icon] ?? Home;
                return (
                  <ResultRow
                    key={`page-${page.id}`}
                    dataIdx={i}
                    active={cursor === i}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => navigate(page.path)}
                    icon={<Icon size={15} />}
                    iconColor={ACTIVE}
                    label={page.label}
                    sublabel={page.description}
                    showArrow
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "8px 16px", borderTop: `1px solid ${BORDER}`,
          display: "flex", gap: 16, flexShrink: 0,
        }}>
          {[
            ["↑↓", "navegar"],
            ["↵",  "abrir"],
            ["Esc","cerrar"],
          ].map(([key, desc]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd style={{ fontSize: 10, color: DIM, border: `1px solid ${BORDER}`, borderRadius: 3, padding: "1px 5px" }}>{key}</kbd>
              <span style={{ fontSize: 11, color: DIM }}>{desc}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: "8px 16px 4px",
      fontSize: 10, fontWeight: 600, letterSpacing: ".07em",
      textTransform: "uppercase", color: DIM,
    }}>
      {label}
    </div>
  );
}

interface RowProps {
  dataIdx:      number;
  active:       boolean;
  onMouseEnter: () => void;
  onClick:      () => void;
  icon:         React.ReactNode;
  iconColor:    string;
  label:        string;
  sublabel?:    string;
  badge?:       string;
  badgeColor?:  string;
  tag?:         string;
  tagColor?:    string;
  showArrow?:   boolean;
}

function ResultRow({
  dataIdx, active, onMouseEnter, onClick,
  icon, iconColor, label, sublabel,
  badge, badgeColor, tag, tagColor, showArrow,
}: RowProps) {
  return (
    <div
      data-idx={dataIdx}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 16px", cursor: "pointer",
        background: active ? HOVER : "transparent",
        transition: "background .1s",
        borderLeft: active ? `2px solid ${ACTIVE}` : "2px solid transparent",
      }}
    >
      {/* Icono */}
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `${iconColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: iconColor,
      }}>
        {icon}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: 11, color: DIM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        {tag && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#fff",
            background: tagColor, borderRadius: 4, padding: "1px 6px",
          }}>
            {tag}
          </span>
        )}
        {badge && (
          <span style={{
            fontSize: 11, color: badgeColor,
            background: `${badgeColor}18`, borderRadius: 4, padding: "2px 7px",
          }}>
            {badge}
          </span>
        )}
        {showArrow && <ArrowRight size={13} style={{ color: DIM }} />}
      </div>
    </div>
  );
}
