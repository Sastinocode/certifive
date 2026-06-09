// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Sidebar from "@/components/layout/sidebar";
import { SearchInput, FilterChip } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Certification {
  id: number;
  ownerName: string;
  ownerDni: string;
  propertyAddress: string;
  cadastralRef: string;
  status: string;
  folderId: number | null;
  energyRating: string | null;
  userId: number;
  createdAt: Date | null;
}

// ── Energy label colours — HTML .lbl-* ───────────────────────────────────────
const ENERGY_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#00a651", text: "#fff" },
  B: { bg: "#50b848", text: "#fff" },
  C: { bg: "#c2d500", text: "#1a1a1a" },
  D: { bg: "#ffe600", text: "#1a1a1a" },
  E: { bg: "#f6a800", text: "#fff" },
  F: { bg: "#ed6e1f", text: "#fff" },
  G: { bg: "#e62e2d", text: "#fff" },
};

// ── EnergyChip — arrow badge matching HTML .e-chip ───────────────────────────
function EnergyChip({ letter, size = "sm" }: { letter: string; size?: "sm" | "lg" }) {
  const colors = ENERGY_COLORS[letter?.toUpperCase()] ?? { bg: "#ccc", text: "#000" };
  const dim = size === "lg" ? { w: 36, h: 32, fs: 16 } : { w: 28, h: 24, fs: 13 };
  return (
    <div className="relative inline-flex items-center" style={{ marginRight: 8 }}>
      <div
        className="rounded flex items-center justify-center font-black"
        style={{
          width: dim.w, height: dim.h, fontSize: dim.fs,
          backgroundColor: colors.bg, color: colors.text,
          boxShadow: "0 1px 2px rgba(0,0,0,.15)",
        }}
      >
        {letter?.toUpperCase() ?? "?"}
      </div>
      <div
        className="absolute"
        style={{
          right: -8, top: 0, bottom: 0,
          width: 0, height: 0,
          borderTop: `${dim.h / 2}px solid transparent`,
          borderBottom: `${dim.h / 2}px solid transparent`,
          borderLeft: `8px solid ${colors.bg}`,
        }}
      />
    </div>
  );
}

// ── StatusPill — HTML .pp .pp-* ──────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const variants: Record<string, { cls: string; label: string }> = {
    completed:   { cls: "bg-primary/[0.12] text-primary",                                              label: "Vigente" },
    expiring:    { cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",         label: "Caduca pronto" },
    expired:     { cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",                 label: "Caducado" },
    in_progress: { cls: "bg-sky-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",              label: "En proceso" },
    draft:       { cls: "bg-muted text-muted-foreground",                                              label: "Borrador" },
    archived:    { cls: "bg-muted text-muted-foreground",                                              label: "Archivado" },
  };
  const v = variants[status] ?? variants.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 py-[3px] px-[9px] rounded-full text-[11px] font-semibold flex-shrink-0 ${v.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {v.label}
    </span>
  );
}

// ── Owner avatar — deterministic colour by name initial ──────────────────────
const OWNER_COLORS = [
  "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
  "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
  "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
];
function ownerColor(name: string) {
  return OWNER_COLORS[((name ?? "").charCodeAt(0) || 0) % OWNER_COLORS.length];
}

// ── Placeholder image bg — HTML .ph-img (diagonal stripe pattern) ─────────────
const PH_IMG_STYLE = {
  background: [
    "linear-gradient(135deg, transparent 45%, hsl(var(--border) / 0.4) 45% 55%, transparent 55%) 0 0/24px 24px",
    "hsl(var(--muted))",
  ].join(", "),
};

// ── Map background — HTML .map-bg ─────────────────────────────────────────────
const MAP_BG_STYLE = {
  background: [
    "linear-gradient(45deg, hsl(var(--muted) / 0.4) 25%, transparent 25%)",
    "linear-gradient(-45deg, hsl(var(--muted) / 0.4) 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, hsl(var(--muted) / 0.4) 75%)",
    "linear-gradient(-45deg, transparent 75%, hsl(var(--muted) / 0.4) 75%)",
    "hsl(215 30% 92%)",
  ].join(", "),
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
};

// ── Map marker positions (reference layout from handoff HTML) ─────────────────
const MAP_POSITIONS = [
  { left: "22%", top: "32%" },
  { left: "45%", top: "25%" },
  { left: "55%", top: "55%" },
  { left: "70%", top: "42%" },
  { left: "30%", top: "65%" },
];

// ── PropertyCard ──────────────────────────────────────────────────────────────
function PropertyCard({ property }: { property: any }) {
  const isExpired = property.status === "expired";
  return (
    <article
      className={[
        "transition-all duration-200 bg-card rounded-2xl border border-border shadow-sm overflow-hidden cursor-pointer",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(15,31,46,.18)]",
        "dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,.6)]",
        isExpired ? "ring-1 ring-red-200 dark:ring-red-900/50" : "",
      ].join(" ")}
    >
      {/* Image placeholder — .ph-img */}
      <div className="aspect-[4/3] relative" style={PH_IMG_STYLE}>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold text-muted-foreground bg-card px-2 py-1 rounded-md border border-border whitespace-nowrap">
          foto fachada
        </span>
        {property.energyRating && (
          <span className="absolute top-3 left-3">
            <EnergyChip letter={property.energyRating} />
          </span>
        )}
        {property.propertyType && property.propertyType !== "Vivienda" && (
          <span className="absolute top-3 right-12 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-card/90 backdrop-blur text-foreground">
            {property.propertyType}
          </span>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground">
          ⋯
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1">
            {property.propertyAddress}
          </h3>
          <StatusPill status={property.status} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {property.city ?? property.municipality ?? "España"}
        </p>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
          {property.surfaceArea && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              {property.surfaceArea} m²
            </span>
          )}
          {property.constructionYear && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {property.constructionYear}
            </span>
          )}
          <span className="ml-auto font-medium text-foreground">
            {property.expiryDate
              ? `vence ${new Date(property.expiryDate).getFullYear()}`
              : property.cadastralRef?.slice(0, 10) ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${ownerColor(property.ownerName ?? "")}`}>
            {(property.ownerName ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{property.ownerName}</p>
        </div>
      </div>
    </article>
  );
}

// ── View toggle button classes — HTML .vbtn / .vbtn.active ────────────────────
function vbtnCls(isActive: boolean) {
  return `px-2.5 py-1.5 rounded-md transition-all duration-100 cursor-pointer ${
    isActive
      ? "bg-card text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Properties() {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView]             = useState<"grid" | "table" | "map">("grid");
  const [mapSelected, setMapSelected] = useState(0);

  const { data: certifications = [], isLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications", "archived"],
    queryFn: async () => {
      const r = await fetch("/api/certifications?status=archived");
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });

  const { data: folders = [] } = useQuery({ queryKey: ["/api/folders"] });

  const properties = useMemo(() => {
    const seen = new Set<string>();
    return (certifications as Certification[]).filter((c) => {
      if (seen.has(c.cadastralRef)) return false;
      seen.add(c.cadastralRef);
      return true;
    });
  }, [certifications]);

  const filtered = useMemo(() => {
    return properties.filter((p: any) => {
      const matchesSearch =
        !search ||
        p.propertyAddress?.toLowerCase().includes(search.toLowerCase()) ||
        p.cadastralRef?.toLowerCase().includes(search.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        typeFilter === "all" ||
        (p.propertyType ?? "vivienda").toLowerCase() === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [properties, search, typeFilter]);

  const total    = properties.length;
  const active   = properties.filter((p) => p.status === "completed").length;
  const expiring = properties.filter((p) => p.status === "expiring").length;
  const expired  = properties.filter((p) => p.status === "expired").length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: properties.length };
    properties.forEach((p: any) => {
      const t = (p.propertyType ?? "vivienda").toLowerCase();
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return counts;
  }, [properties]);

  const typeFilters = [
    { key: "all",      label: "Todos" },
    { key: "vivienda", label: "Vivienda" },
    { key: "local",    label: "Local" },
    { key: "oficina",  label: "Oficina" },
  ];

  // Map: show up to 5 markers; clamp selected index
  const mapProperties  = filtered.slice(0, 5);
  const selectedMapIdx = Math.min(mapSelected, Math.max(0, mapProperties.length - 1));
  const selectedProp   = (mapProperties[selectedMapIdx] as any) ?? null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar selectedTab="properties" onTabChange={() => {}} />

      <main className="flex-1 overflow-auto">
        <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1500px] mx-auto space-y-6">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Inmuebles</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Todas las viviendas, locales y oficinas que has certificado
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Importar catastro
              </button>
              <button className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo inmueble
              </button>
            </div>
          </div>

          {/* ── KPI strip ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total inmuebles</p>
              <p className="text-2xl font-bold text-foreground mt-1.5 leading-none">{total}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Certificados</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Activos</p>
              <p className="text-2xl font-bold text-foreground mt-1.5 leading-none">{active}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Certificado vigente</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4 ring-1 ring-amber-200 dark:ring-amber-900/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Próximos a caducar</p>
              <p className="text-2xl font-bold text-foreground mt-1.5 leading-none">{expiring}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">&lt; 6 meses</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Caducados</p>
              <p className="text-2xl font-bold text-foreground mt-1.5 leading-none">{expired}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">A renovar</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Letra media</p>
              <div className="flex items-center gap-2 mt-1">
                <EnergyChip letter="D" size="lg" />
                <p className="text-[11px] text-muted-foreground">Parque construido<br />años 70-90</p>
              </div>
            </div>
          </div>

          {/* ── Toolbar ────────────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-3 flex flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Buscar por dirección, referencia catastral o propietario…"
              value={search}
              onChange={setSearch}
              className="flex-1 min-w-[240px]"
            />

            <div className="flex items-center gap-1.5 flex-wrap">
              {typeFilters.map(({ key, label }) => (
                <FilterChip
                  key={key}
                  label={label}
                  count={typeCounts[key] ?? 0}
                  active={typeFilter === key}
                  onClick={() => setTypeFilter(key)}
                />
              ))}
            </div>

            {/* View toggle — HTML .vbtn */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
              <button onClick={() => setView("grid")} title="Cuadrícula" className={vbtnCls(view === "grid")}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              </button>
              <button onClick={() => setView("table")} title="Tabla" className={vbtnCls(view === "table")}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <button onClick={() => setView("map")} title="Mapa" className={vbtnCls(view === "map")}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
              </button>
            </div>
          </div>

          {/* ══ Grid view ══════════════════════════════════════════════════ */}
          {view === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                      <div className="aspect-[4/3] bg-muted animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))
                : filtered.length === 0
                  ? (
                    <div className="col-span-full bg-card rounded-2xl border border-border p-16 text-center">
                      <p className="text-muted-foreground text-sm">No se encontraron inmuebles</p>
                    </div>
                  )
                  : filtered.map((p) => <PropertyCard key={p.id} property={p} />)
              }
            </div>
          )}

          {/* ══ Table view ════════════════════════════════════════════════ */}
          {view === "table" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Inmueble</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Letra</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Tipo / m²</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Propietario</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Vencimiento</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-border">
                            {Array.from({ length: 6 }).map((_, j) => (
                              <td key={j} className="px-5 py-3">
                                <div className="h-4 bg-muted rounded animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : filtered.map((p: any) => (
                          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-foreground">{p.propertyAddress}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{p.cadastralRef}</p>
                            </td>
                            <td className="px-3 py-3">
                              {p.energyRating
                                ? <EnergyChip letter={p.energyRating} />
                                : <span className="text-muted-foreground">—</span>
                              }
                            </td>
                            <td className="px-3 py-3 text-muted-foreground">
                              {[p.propertyType ?? "Vivienda", p.surfaceArea ? `${p.surfaceArea} m²` : null].filter(Boolean).join(" · ")}
                            </td>
                            <td className="px-3 py-3">{p.ownerName}</td>
                            <td className="px-3 py-3 text-muted-foreground">
                              {p.expiryDate
                                ? new Date(p.expiryDate).toLocaleDateString("es-ES")
                                : "—"}
                            </td>
                            <td className="px-3 py-3"><StatusPill status={p.status} /></td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ Map view ══════════════════════════════════════════════════ */}
          {view === "map" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-[560px]">

                {/* Map canvas */}
                <div className="relative" style={MAP_BG_STYLE}>
                  {/* Faux roads */}
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 600 500" preserveAspectRatio="none">
                    <path d="M0 200 L600 180" stroke="hsl(var(--muted-foreground))" strokeWidth="6" fill="none"/>
                    <path d="M0 320 L600 340" stroke="hsl(var(--muted-foreground))" strokeWidth="4" fill="none"/>
                    <path d="M150 0 L180 500" stroke="hsl(var(--muted-foreground))" strokeWidth="5" fill="none"/>
                    <path d="M380 0 L410 500" stroke="hsl(var(--muted-foreground))" strokeWidth="4" fill="none"/>
                    <path d="M0 80 Q200 100 600 60" stroke="hsl(var(--muted-foreground))" strokeWidth="3" fill="none"/>
                  </svg>

                  {/* Markers */}
                  {mapProperties.map((p: any, i) => {
                    const pos    = MAP_POSITIONS[i];
                    const isSel  = i === selectedMapIdx;
                    const col    = ENERGY_COLORS[p.energyRating?.toUpperCase()] ?? { bg: "#6b7280", text: "#fff" };
                    return (
                      <button
                        key={p.id}
                        className={`absolute ${isSel ? "scale-125 z-10" : ""}`}
                        style={{ left: pos.left, top: pos.top }}
                        title={p.propertyAddress}
                        onClick={() => setMapSelected(i)}
                      >
                        <div className="relative">
                          <div
                            className={`${isSel ? "w-10 h-10 text-sm ring-4" : "w-8 h-8 text-xs ring-2"} rounded-full flex items-center justify-center font-bold shadow-lg ring-card`}
                            style={{ backgroundColor: col.bg, color: col.text }}
                          >
                            {p.energyRating?.toUpperCase() ?? "?"}
                          </div>
                          <div
                            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${isSel ? "w-3 h-3" : "w-2 h-2"} rotate-45`}
                            style={{ backgroundColor: col.bg }}
                          />
                        </div>
                      </button>
                    );
                  })}

                  {/* Map controls */}
                  <div className="absolute top-3 right-3 flex flex-col bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <button className="w-9 h-9 hover:bg-muted/40 inline-flex items-center justify-center text-foreground border-b border-border">+</button>
                    <button className="w-9 h-9 hover:bg-muted/40 inline-flex items-center justify-center text-foreground">−</button>
                  </div>

                  {/* Count badge */}
                  <div className="absolute bottom-3 left-3 bg-card border border-border rounded-lg shadow-sm px-3 py-2 text-[11px] font-medium text-foreground">
                    📍 {filtered.length} inmuebles
                  </div>
                </div>

                {/* Side panel — selected property */}
                <aside className="border-l border-border bg-card p-5 overflow-y-auto">
                  {selectedProp ? (
                    <>
                      <div className="aspect-[4/3] rounded-xl mb-4 relative" style={PH_IMG_STYLE}>
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold text-muted-foreground bg-card px-2 py-1 rounded-md border border-border whitespace-nowrap">
                          foto fachada
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-foreground">{selectedProp.propertyAddress}</h3>
                          <p className="text-[11px] text-muted-foreground">{selectedProp.city ?? selectedProp.municipality ?? "España"}</p>
                        </div>
                        {selectedProp.energyRating && <EnergyChip letter={selectedProp.energyRating} size="lg" />}
                      </div>
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="text-foreground font-medium">{selectedProp.propertyType ?? "Vivienda"}</span></div>
                        {selectedProp.surfaceArea && <div className="flex justify-between"><span className="text-muted-foreground">Superficie</span><span className="text-foreground font-medium">{selectedProp.surfaceArea} m²</span></div>}
                        {selectedProp.constructionYear && <div className="flex justify-between"><span className="text-muted-foreground">Año construcción</span><span className="text-foreground font-medium">{selectedProp.constructionYear}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Propietario</span><span className="text-foreground font-medium">{selectedProp.ownerName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Catastral</span><span className="text-foreground font-mono text-[10px]">{selectedProp.cadastralRef?.slice(0, 10) ?? "—"}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Estado</span><StatusPill status={selectedProp.status} /></div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button className="h-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Renovar</button>
                        <button className="h-9 rounded-full border border-border bg-card text-xs font-medium hover:bg-muted/40">Ver expediente</button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Sin inmuebles · ajusta los filtros</p>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}
