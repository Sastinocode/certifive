// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { LayoutGrid, List, Map, Search, Upload, Plus } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";

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

const ENERGY_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#00a651", text: "#fff" },
  B: { bg: "#50b848", text: "#fff" },
  C: { bg: "#c2d500", text: "#1a1a1a" },
  D: { bg: "#ffe600", text: "#1a1a1a" },
  E: { bg: "#f6a800", text: "#fff" },
  F: { bg: "#ed6e1f", text: "#fff" },
  G: { bg: "#e62e2d", text: "#fff" },
};

function EnergyChip({ letter, size = "sm" }: { letter: string; size?: "sm" | "lg" }) {
  const colors = ENERGY_COLORS[letter?.toUpperCase()] ?? { bg: "#ccc", text: "#000" };
  const dim = size === "lg" ? { w: 36, h: 32, fs: 15 } : { w: 28, h: 24, fs: 13 };
  return (
    <div className="relative inline-flex items-center" style={{ marginRight: 8 }}>
      <div
        className="rounded flex items-center justify-center font-black"
        style={{ width: dim.w, height: dim.h, fontSize: dim.fs, backgroundColor: colors.bg, color: colors.text }}
      >
        {letter?.toUpperCase() ?? "?"}
      </div>
      <div
        className="absolute"
        style={{
          right: -8,
          top: 0,
          bottom: 0,
          width: 0,
          height: 0,
          borderTop: `${dim.h / 2}px solid transparent`,
          borderBottom: `${dim.h / 2}px solid transparent`,
          borderLeft: `8px solid ${colors.bg}`,
        }}
      />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const variants: Record<string, { cls: string; label: string }> = {
    completed:   { cls: "bg-primary/10 text-primary", label: "Vigente" },
    expiring:    { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Caduca pronto" },
    expired:     { cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", label: "Caducado" },
    in_progress: { cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "En proceso" },
    draft:       { cls: "bg-muted text-muted-foreground", label: "Borrador" },
    archived:    { cls: "bg-muted text-muted-foreground", label: "Archivado" },
  };
  const v = variants[status] ?? variants.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${v.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {v.label}
    </span>
  );
}

function PropertyCard({ property }: { property: any }) {
  return (
    <article className="group bg-card rounded-2xl border border-border shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="aspect-[4/3] relative bg-muted/60">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-card px-2 py-1 rounded border border-border">
            foto fachada
          </span>
        </div>
        {property.energyRating && (
          <div className="absolute top-3 left-3">
            <EnergyChip letter={property.energyRating} />
          </div>
        )}
        {property.propertyType && property.propertyType !== "Vivienda" && (
          <span className="absolute top-3 right-12 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-card/90 text-foreground">
            {property.propertyType}
          </span>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          ···
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold leading-snug line-clamp-1">{property.propertyAddress}</h3>
          <StatusPill status={property.status} />
        </div>
        <p className="text-[11px] text-muted-foreground">{property.city ?? "España"}</p>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
          {property.surfaceArea && <span>{property.surfaceArea} m²</span>}
          {property.constructionYear && <span>{property.constructionYear}</span>}
          <span className="ml-auto font-mono text-[10px] truncate max-w-[80px]">
            {property.cadastralRef?.slice(0, 10) ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
            {property.ownerName?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{property.ownerName}</p>
        </div>
      </div>
    </article>
  );
}

export default function Properties() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<"grid" | "table" | "map">("grid");

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
        typeFilter === "all" || p.propertyType?.toLowerCase() === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [properties, search, typeFilter]);

  const total = properties.length;
  const active = properties.filter((p) => p.status === "completed").length;
  const expiring = properties.filter((p) => p.status === "expiring").length;
  const expired = properties.filter((p) => p.status === "expired").length;
  const inProgress = properties.filter((p) => p.status === "in_progress").length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: properties.length };
    properties.forEach((p: any) => {
      const t = (p.propertyType ?? "vivienda").toLowerCase();
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return counts;
  }, [properties]);

  const typeFilters = [
    { key: "all", label: "Todos" },
    { key: "vivienda", label: "Vivienda" },
    { key: "local", label: "Local" },
    { key: "oficina", label: "Oficina" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar selectedTab="properties" onTabChange={() => {}} />

      <main className="flex-1 overflow-auto">
        <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inmuebles</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Todas las viviendas, locales y oficinas certificadas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Importar catastro
              </button>
              <button className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Nuevo inmueble
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="text-2xl font-bold mt-1.5 leading-none">{total}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Inmuebles</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Activos</p>
              <p className="text-2xl font-bold mt-1.5 leading-none">{active}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Certificado vigente</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4 ring-1 ring-amber-200 dark:ring-amber-900/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Próx. a caducar</p>
              <p className="text-2xl font-bold mt-1.5 leading-none">{expiring}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">&lt; 6 meses</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Caducados</p>
              <p className="text-2xl font-bold mt-1.5 leading-none">{expired}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">A renovar</p>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">En proceso</p>
              <p className="text-2xl font-bold mt-1.5 leading-none">{inProgress}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Expedientes abiertos</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por dirección, referencia catastral o propietario…"
                className="w-full h-10 pl-10 pr-4 bg-muted/40 border border-transparent rounded-xl text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-border transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {typeFilters.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    typeFilter === key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      typeFilter === key
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {typeCounts[key === "all" ? "all" : key] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-1">
              <button
                onClick={() => setView("grid")}
                title="Cuadrícula"
                className={`p-2 rounded-md transition-all ${view === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("table")}
                title="Tabla"
                className={`p-2 rounded-md transition-all ${view === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("map")}
                title="Mapa"
                className={`p-2 rounded-md transition-all ${view === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid view */}
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

          {/* Table view */}
          {view === "table" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Inmueble", "Letra", "Propietario", "Ref. catastral", "Estado"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-border">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <td key={j} className="px-5 py-3">
                                <div className="h-4 bg-muted rounded animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : filtered.map((p) => (
                          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-foreground">{p.propertyAddress}</p>
                              <p className="text-[11px] text-muted-foreground">{(p as any).city ?? "España"}</p>
                            </td>
                            <td className="px-5 py-3">
                              {p.energyRating ? (
                                <div className="pl-1"><EnergyChip letter={p.energyRating} /></div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">{p.ownerName}</td>
                            <td className="px-5 py-3">
                              <span className="font-mono text-[11px] text-muted-foreground">{p.cadastralRef}</span>
                            </td>
                            <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Map view */}
          {view === "map" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="h-[500px] flex items-center justify-center bg-muted/20">
                <div className="text-center">
                  <Map className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Vista de mapa</p>
                  <p className="text-xs text-muted-foreground mt-1">{total} inmuebles en tu zona</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
