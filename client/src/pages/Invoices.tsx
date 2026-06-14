// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate, formatCurrency } from "../lib/utils";
import Sidebar from "@/components/layout/sidebar";
import { SectionCard } from "@/components/ui";
import { FileText } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  dniNif?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  company?: string | null;
}

// ── Status pill config — HTML .pp .pp-* ──────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:     { label: "Borrador",  cls: "bg-muted text-muted-foreground" },
  sent:      { label: "Enviada",   cls: "bg-sky-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  paid:      { label: "Pagada",    cls: "bg-primary/[0.12] text-primary dark:bg-primary/[0.18]" },
  overdue:   { label: "Vencida",   cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  partial:   { label: "Parcial",   cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  pending:   { label: "Pendiente", cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  cancelled: { label: "Anulada",   cls: "bg-muted text-muted-foreground line-through" },
};

function StatusPill({ status }: { status: string }) {
  const v = STATUS_CONFIG[(status || "pending").toLowerCase()] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 py-[3px] px-[10px] rounded-full text-[11px] font-semibold flex-shrink-0 ${v.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {v.label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  "bg-violet-100  dark:bg-violet-950/40  text-violet-700  dark:text-violet-300",
  "bg-blue-100    dark:bg-blue-950/40    text-blue-700    dark:text-blue-300",
  "bg-amber-100   dark:bg-amber-950/40   text-amber-700   dark:text-amber-300",
  "bg-red-100     dark:bg-red-950/40     text-red-700     dark:text-red-300",
  "bg-sky-100     dark:bg-sky-950/40     text-sky-700     dark:text-sky-300",
];
function avatarColor(name: string) {
  return AVATAR_COLORS[((name || "").charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// ── Filter tabs — order matches HTML ─────────────────────────────────────────
const FILTER_TABS = [
  { value: "all",     label: "Todas" },
  { value: "draft",   label: "Borrador" },
  { value: "sent",    label: "Enviadas" },
  { value: "paid",    label: "Pagadas" },
  { value: "partial", label: "Parcial" },
  { value: "overdue", label: "Vencidas" },
];

// ── Cashflow chart — static reference data (HTML handoff) ─────────────────────
const CASHFLOW_BARS = [
  { b: 32, c: 30 }, { b: 38, c: 36 }, { b: 45, c: 40 }, { b: 52, c: 48 },
  { b: 60, c: 55 }, { b: 56, c: 52 }, { b: 68, c: 62 }, { b: 72, c: 68 },
  { b: 78, c: 72 }, { b: 82, c: 70 }, { b: 88, c: 80 }, { b: 95, c: 78 },
];
const CASHFLOW_MONTHS = ["Jun","Jul","Ago","Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr","May"];

// ── Form input class ──────────────────────────────────────────────────────────
const INPUT_CLS = "w-full h-10 bg-muted/40 border border-border hover:border-border/70 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none text-foreground placeholder:text-muted-foreground transition-colors";

// ─────────────────────────────────────────────────────────────────────────────
export default function Invoices() {
  const [showForm, setShowForm]               = useState(false);
  const [statusFilter, setStatusFilter]       = useState("all");
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [checkedIds, setCheckedIds]           = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    clientName: "", clientDni: "", clientAddress: "",
    amount: "", tax: "21", description: "",
  });

  const { data: invoices, isLoading } = useQuery<any[]>({ queryKey: ["/api/invoices"] });
  const { data: user }                = useQuery<User>({ queryKey: ["/api/auth/user"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const amount    = parseFloat(data.amount);
      const taxRate   = parseFloat(data.tax) / 100;
      const taxAmount = amount * taxRate;
      return apiRequest("POST", "/api/invoices", { ...data, amount, tax: taxAmount, totalAmount: amount + taxAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowForm(false);
      setForm({ clientName: "", clientDni: "", clientAddress: "", amount: "", tax: "21", description: "" });
    },
  });

  // ── Computed ────────────────────────────────────────────────────────────────
  const allInvoices   = Array.isArray(invoices) ? invoices : [];
  const totalRevenue  = allInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
  const paidRevenue   = allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
  const pendingCount  = allInvoices.filter(i => i.status === "pending").length;
  const overdueCount  = allInvoices.filter(i => i.status === "overdue").length;
  const collectedPct  = totalRevenue > 0 ? Math.round(paidRevenue / totalRevenue * 100) : 0;

  const countByStatus = (s: string) => s === "all" ? allInvoices.length : allInvoices.filter(i => i.status === s).length;

  const filteredInvoices = allInvoices.filter(inv => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchSearch = !searchTerm ||
      (inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.clientName    || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const selectedInvoice: any =
    (selectedInvoiceId != null ? allInvoices.find(i => i.id === selectedInvoiceId) : null)
    ?? filteredInvoices[0]
    ?? null;

  // ── Bulk selection ───────────────────────────────────────────────────────────
  const toggleCheck = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = (checked: boolean) => {
    setCheckedIds(checked ? new Set(filteredInvoices.map(i => i.id)) : new Set());
  };
  const allChecked = filteredInvoices.length > 0 && filteredInvoices.every(i => checkedIds.has(i.id));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar selectedTab="facturas" onTabChange={() => {}} />

      <main className="flex-1 overflow-auto">
        <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1500px] mx-auto space-y-6">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Facturación</h1>
              <p className="text-sm text-muted-foreground mt-1">Emite, cobra y controla todas tus facturas en un solo sitio</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar
              </button>
              <button
                data-testid="btn-nueva-factura"
                onClick={() => setShowForm(!showForm)}
                className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nueva factura
              </button>
            </div>
          </div>

          {/* ── KPI strip ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 — Total facturado (delta chip) */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total facturado</p>
                <span className="inline-flex items-center text-[10px] font-semibold rounded-full px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">↑ 18%</span>
              </div>
              <p className="text-[1.75rem] font-bold text-foreground tracking-tight leading-none">{formatCurrency(totalRevenue)}</p>
              <p className="text-[11px] text-muted-foreground">{allInvoices.length} facturas emitidas</p>
            </div>

            {/* KPI 2 — Cobrado (inline: progress bar) */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Cobrado</p>
              <p className="text-[1.75rem] font-bold text-foreground tracking-tight leading-none">{formatCurrency(paidRevenue)}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${collectedPct}%` }} />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground">{collectedPct}%</p>
              </div>
            </div>

            {/* KPI 3 — Pendiente */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Pendiente</p>
              <p className="text-[1.75rem] font-bold text-foreground tracking-tight leading-none">{pendingCount}</p>
              <p className="text-[11px] text-muted-foreground">facturas · pendientes de cobro</p>
            </div>

            {/* KPI 4 — Vencido (inline: ring + red + button) */}
            <div className={`bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3 ${overdueCount > 0 ? "ring-1 ring-red-200 dark:ring-red-900/50" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>Vencido</p>
                {overdueCount > 0 && (
                  <button className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline">Reclamar</button>
                )}
              </div>
              <p className={`text-[1.75rem] font-bold tracking-tight leading-none ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{overdueCount}</p>
              <p className="text-[11px] text-muted-foreground">{overdueCount} facturas &gt; 30 días</p>
            </div>
          </div>

          {/* ── Cashflow mini-chart ─────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Flujo de caja · últimos 12 meses</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Comparativa facturado (verde) vs. cobrado (azul)</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-primary" />
                  <span className="text-muted-foreground">Facturado</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-blue-500" />
                  <span className="text-muted-foreground">Cobrado</span>
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-1 h-32">
              {CASHFLOW_BARS.map((bar, i) => {
                const isLast = i === CASHFLOW_BARS.length - 1;
                return (
                  <div key={i} className="flex-1 flex items-end gap-0.5 group">
                    <div
                      className={`flex-1 rounded-t transition-colors ${isLast ? "bg-primary group-hover:bg-primary" : "bg-primary/70 group-hover:bg-primary"}`}
                      style={{ height: `${bar.b}%` }}
                    />
                    <div
                      className={`flex-1 rounded-t transition-colors ${isLast ? "bg-blue-500 group-hover:bg-blue-500" : "bg-blue-400 group-hover:bg-blue-500"}`}
                      style={{ height: `${bar.c}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-1 mt-2 text-[10px] text-muted-foreground font-medium">
              {CASHFLOW_MONTHS.map((m, i) => (
                <span key={m} className={`flex-1 text-center ${i === CASHFLOW_MONTHS.length - 1 ? "font-bold text-foreground" : ""}`}>{m}</span>
              ))}
            </div>
          </div>

          {/* ── Nueva factura form (SectionCard) ───────────────────────────── */}
          {showForm && (
            <SectionCard
              title="Nueva factura"
              icon={<FileText size={18} />}
              action={
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                >✕</button>
              }
              bodyPadding="none"
              className="overflow-hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">Datos del emisor</p>
                    <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{user?.company || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Tu empresa"}</p>
                      <p className="text-xs text-muted-foreground">NIF: {user?.dniNif || "—"}</p>
                      <p className="text-xs text-muted-foreground">{user?.address || ""}{user?.city ? `, ${user.city}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Datos del cliente</p>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Nombre del cliente *</label>
                      <input data-testid="input-clientName" className={INPUT_CLS} value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Nombre completo o razón social" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">DNI / NIF / CIF</label>
                      <input data-testid="input-clientDni" className={INPUT_CLS} value={form.clientDni} onChange={e => setForm(f => ({ ...f, clientDni: e.target.value }))} placeholder="12345678A" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Dirección fiscal</label>
                      <input data-testid="input-clientAddress" className={INPUT_CLS} value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} placeholder="Calle, número, ciudad" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Descripción del servicio</label>
                    <input data-testid="input-description" className={INPUT_CLS} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Certificado de eficiencia energética" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">IVA (%)</label>
                    <select data-testid="select-tax" className={INPUT_CLS} value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))}>
                      <option value="21">21%</option>
                      <option value="10">10%</option>
                      <option value="4">4%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Base imponible (€) *</label>
                    <input data-testid="input-amount" type="number" min="0" step="0.01" className={INPUT_CLS} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  {form.amount && (
                    <div className="md:col-span-2 bg-muted/30 rounded-xl p-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base</span>
                          <span className="font-semibold text-foreground">{formatCurrency(parseFloat(form.amount) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA {form.tax}%</span>
                          <span className="font-semibold text-foreground">{formatCurrency((parseFloat(form.amount) || 0) * (parseFloat(form.tax) / 100))}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 mt-1">
                          <span className="font-bold text-foreground">Total</span>
                          <span className="font-bold text-foreground">{formatCurrency((parseFloat(form.amount) || 0) * (1 + parseFloat(form.tax) / 100))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowForm(false)} className="h-10 px-5 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors">
                    Cancelar
                  </button>
                  <button
                    data-testid="btn-create-invoice"
                    onClick={() => createMutation.mutate(form)}
                    disabled={!form.clientName || !form.amount || createMutation.isPending}
                    className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {createMutation.isPending ? "Creando..." : "Crear factura"}
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ══ Master + Detail ════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6">

            {/* ── Master: invoices table ──────────────────────────────────── */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

              {/* Toolbar */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FILTER_TABS.map(tab => {
                      const isActive = statusFilter === tab.value;
                      return (
                        <button
                          key={tab.value}
                          onClick={() => setStatusFilter(tab.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full border text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? "bg-foreground text-background border-foreground"
                              : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                          }`}
                        >
                          {tab.label}
                          <span className={`rounded-full px-1.5 text-[10px] font-bold min-w-[18px] text-center ${
                            isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                          }`}>
                            {countByStatus(tab.value)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Search + filter button */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar nº o cliente…"
                        className="h-9 pl-9 pr-3 w-56 bg-muted/40 border border-transparent rounded-full text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-border text-foreground"
                      />
                    </div>
                    <button className="h-9 px-3 rounded-full border border-border bg-card text-xs font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                      Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk actions bar */}
              {checkedIds.size > 0 && (
                <div className="px-5 py-2.5 bg-primary/5 dark:bg-primary/10 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{checkedIds.size} facturas seleccionadas</p>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <button className="px-3 py-1 rounded-full bg-card border border-border hover:bg-muted/40 inline-flex items-center gap-1.5">📧 Enviar por email</button>
                    <button className="px-3 py-1 rounded-full bg-card border border-border hover:bg-muted/40 inline-flex items-center gap-1.5">⬇ Descargar PDFs</button>
                    <button className="px-3 py-1 rounded-full bg-card border border-border hover:bg-muted/40 inline-flex items-center gap-1.5">✓ Marcar pagadas</button>
                    <button
                      onClick={() => setCheckedIds(new Set())}
                      className="px-3 py-1 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 inline-flex items-center gap-1.5"
                    >🗑 Eliminar</button>
                  </div>
                </div>
              )}

              {/* Table */}
              {isLoading ? (
                <div className="p-16 text-center">
                  <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-muted-foreground w-8 h-8" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">Sin facturas</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "No hay resultados para los filtros aplicados."
                      : "Crea tu primera factura haciendo clic en «Nueva factura»"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="w-10 px-5 py-3">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={e => toggleAll(e.target.checked)}
                            className="w-4 h-4 rounded border-[1.5px] border-border accent-primary cursor-pointer"
                          />
                        </th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Número</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Cliente</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Emisión</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Vence</th>
                        <th className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Estado</th>
                        <th className="w-10 px-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv: any) => {
                        const isSel      = selectedInvoice?.id === inv.id;
                        const isCancelled = inv.status === "cancelled";
                        const isOverdueRow = inv.status === "overdue";
                        const isChecked  = checkedIds.has(inv.id);
                        return (
                          <tr
                            key={inv.id}
                            data-testid={`row-invoice-${inv.id}`}
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                              isSel
                                ? "bg-primary/[0.05] dark:bg-primary/[0.10]"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <td
                              className={`px-5 py-3.5 ${isSel ? "shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}
                              onClick={e => { e.stopPropagation(); toggleCheck(inv.id); }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCheck(inv.id)}
                                className="w-4 h-4 rounded border-[1.5px] border-border accent-primary cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-3.5">
                              <p className={`font-semibold text-foreground ${isCancelled ? "line-through opacity-60" : ""}`}>{inv.invoiceNumber}</p>
                              <p className="text-[11px] text-muted-foreground">{inv.description || "Certificado energético"}</p>
                            </td>
                            <td className={`px-3 py-3.5 ${isCancelled ? "opacity-60" : ""}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isCancelled ? "bg-muted text-muted-foreground" : avatarColor(inv.clientName || "")}`}>
                                  {initials(inv.clientName || "")}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate">{inv.clientName}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{inv.clientDni || inv.clientEmail || ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-muted-foreground">{formatDate(inv.issuedAt)}</td>
                            <td className="px-3 py-3.5">
                              {isOverdueRow ? (
                                <>
                                  <span className="text-red-600 dark:text-red-400 font-semibold">{formatDate(inv.dueDate) || "—"}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">{formatDate(inv.dueDate) || "—"}</span>
                              )}
                            </td>
                            <td className={`px-3 py-3.5 text-right font-semibold tabular-nums ${isCancelled ? "opacity-60" : ""}`}>
                              {formatCurrency(inv.totalAmount)}
                            </td>
                            <td className="px-3 py-3.5">
                              <StatusPill status={inv.status} />
                            </td>
                            <td
                              className="px-3 py-3.5 text-muted-foreground hover:text-foreground"
                              onClick={e => e.stopPropagation()}
                            >⋯</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer / pagination */}
              {filteredInvoices.length > 0 && (
                <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
                  <p className="text-muted-foreground">
                    Mostrando <span className="font-semibold text-foreground">{filteredInvoices.length}</span> de {allInvoices.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button className="h-8 px-3 rounded-lg border border-border bg-card font-medium hover:bg-muted/40">←</button>
                    <button className="h-8 w-8 rounded-lg bg-foreground text-background font-semibold">1</button>
                    <button className="h-8 px-3 rounded-lg border border-border bg-card font-medium hover:bg-muted/40">→</button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Detail panel ────────────────────────────────────────────── */}
            {selectedInvoice && (
              <aside className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-fit xl:sticky xl:top-6">
                {/* Header */}
                <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground tracking-tight">{selectedInvoice.invoiceNumber}</p>
                      <StatusPill status={selectedInvoice.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Emitida {formatDate(selectedInvoice.issuedAt)}
                      {selectedInvoice.dueDate ? ` · vence ${formatDate(selectedInvoice.dueDate)}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceId(null)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </header>

                {/* Quick actions */}
                <div className="px-5 py-3 border-b border-border grid grid-cols-4 gap-2">
                  {[
                    { label: "PDF",      icon: <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>, extra: <><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> },
                    { label: "Email",    icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, extra: null },
                    { label: "Duplicar", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>, extra: null },
                    { label: "Anular",   icon: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/></>, extra: null },
                  ].map(({ label, icon, extra }) => (
                    <button key={label} className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-muted/40">
                      <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        {icon}{extra}
                      </svg>
                      <span className="text-[10px] font-semibold text-foreground">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Paper preview */}
                <div className="px-5 py-4 bg-muted/30">
                  <div
                    className="p-4 mx-auto max-w-[280px] rounded-lg text-[11px] leading-[1.55] text-[#0f1f2e] dark:text-[#0f1f2e]"
                    style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-[10px] font-bold mb-1">C</div>
                        <p className="text-[8px] font-bold">CERTIFIVE SOLUCIONES</p>
                        <p className="text-[7px] text-gray-500">B-87654321</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] text-gray-500 uppercase tracking-wider">Factura</p>
                        <p className="text-[10px] font-bold">{selectedInvoice.invoiceNumber}</p>
                        <p className="text-[7px] text-gray-500">{formatDate(selectedInvoice.issuedAt)}</p>
                      </div>
                    </div>
                    <div className="border-t border-b border-gray-200 py-2 mb-3 text-[8px]">
                      <p className="text-gray-500">Cliente</p>
                      <p className="font-semibold">{selectedInvoice.clientName}</p>
                      {selectedInvoice.clientDni && <p className="text-gray-500">DNI {selectedInvoice.clientDni}</p>}
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[8px]">
                        <span>{selectedInvoice.description || "Certificado energético"}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(selectedInvoice.amount || 0)}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2 space-y-0.5 text-[8px]">
                      <div className="flex justify-between text-gray-500"><span>Base imponible</span><span className="tabular-nums">{formatCurrency(selectedInvoice.amount || 0)}</span></div>
                      <div className="flex justify-between text-gray-500"><span>IVA 21%</span><span className="tabular-nums">{formatCurrency(selectedInvoice.tax || 0)}</span></div>
                      <div className="flex justify-between font-bold text-[10px] pt-1"><span>TOTAL</span><span className="tabular-nums">{formatCurrency(selectedInvoice.totalAmount || 0)}</span></div>
                    </div>
                    {selectedInvoice.status === "paid" && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold bg-green-100 text-green-700">
                          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
                          PAGADO
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="px-5 py-4 border-t border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Historial</p>
                  <ol className="space-y-3 relative">
                    <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                    {selectedInvoice.status === "paid" && (
                      <li className="flex gap-3 relative">
                        <span className="w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 ring-4 ring-card">
                          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4}><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">Pago confirmado</p>
                          <p className="text-[11px] text-muted-foreground">Transferencia bancaria</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(selectedInvoice.paidAt || selectedInvoice.updatedAt)}</p>
                        </div>
                      </li>
                    )}
                    {["sent", "paid"].includes(selectedInvoice.status) && (
                      <li className="flex gap-3 relative">
                        <span className="w-3.5 h-3.5 rounded-full bg-card border-2 border-blue-500 flex-shrink-0 mt-0.5 ring-4 ring-card" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">Vista por el cliente</p>
                          <p className="text-[11px] text-muted-foreground">Enlace de pago</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(selectedInvoice.issuedAt)}</p>
                        </div>
                      </li>
                    )}
                    {selectedInvoice.status !== "draft" && (
                      <li className="flex gap-3 relative">
                        <span className="w-3.5 h-3.5 rounded-full bg-card border-2 border-border flex-shrink-0 mt-0.5 ring-4 ring-card" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">Email enviado</p>
                          <p className="text-[11px] text-muted-foreground">{selectedInvoice.clientDni || selectedInvoice.clientName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(selectedInvoice.issuedAt)}</p>
                        </div>
                      </li>
                    )}
                    <li className="flex gap-3 relative">
                      <span className="w-3.5 h-3.5 rounded-full bg-card border-2 border-border flex-shrink-0 mt-0.5 ring-4 ring-card" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">Factura emitida</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(selectedInvoice.issuedAt)}</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </aside>
            )}
          </div>

          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}
