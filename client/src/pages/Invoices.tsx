import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate, formatCurrency } from "../lib/utils";
import Sidebar from "@/components/layout/sidebar";
import { Plus, Download, Search, FileText, TrendingUp, Clock, AlertTriangle } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; cls: string; dotCls: string }> = {
  draft:     { label: "Borrador",  cls: "bg-muted text-muted-foreground",                                   dotCls: "bg-muted-foreground" },
  sent:      { label: "Enviada",   cls: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300", dotCls: "bg-blue-500" },
  paid:      { label: "Pagada",    cls: "bg-primary/10 text-primary",                                        dotCls: "bg-primary" },
  pending:   { label: "Pendiente", cls: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300", dotCls: "bg-amber-500" },
  overdue:   { label: "Vencida",   cls: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",    dotCls: "bg-red-500" },
  cancelled: { label: "Anulada",   cls: "bg-muted text-muted-foreground",                                   dotCls: "bg-muted-foreground" },
};

function getStatus(inv: any) {
  const raw = (inv.status || "pending").toLowerCase();
  return STATUS_CONFIG[raw] ?? STATUS_CONFIG.pending;
}

function initials(name: string) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const FILTER_TABS = [
  { value: "all",       label: "Todas" },
  { value: "draft",     label: "Borrador" },
  { value: "sent",      label: "Enviadas" },
  { value: "pending",   label: "Pendientes" },
  { value: "paid",      label: "Pagadas" },
  { value: "overdue",   label: "Vencidas" },
];

const INPUT_CLS = "w-full h-10 bg-muted/40 border border-transparent rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none text-foreground placeholder:text-muted-foreground";

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    clientName: "", clientDni: "", clientAddress: "",
    amount: "", tax: "21", description: "",
  });

  const { data: invoices, isLoading } = useQuery<any[]>({ queryKey: ["/api/invoices"] });
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/user"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const amount = parseFloat(data.amount);
      const taxRate = parseFloat(data.tax) / 100;
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;
      return apiRequest("POST", "/api/invoices", { ...data, amount, tax: taxAmount, totalAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowForm(false);
      setForm({ clientName: "", clientDni: "", clientAddress: "", amount: "", tax: "21", description: "" });
    },
  });

  const allInvoices = Array.isArray(invoices) ? invoices : [];
  const totalRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const paidRevenue  = allInvoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const pendingCount = allInvoices.filter(i => i.status === "pending").length;
  const overdueCount = allInvoices.filter(i => i.status === "overdue").length;
  const countByStatus = (s: string) => s === "all" ? allInvoices.length : allInvoices.filter(i => i.status === s).length;

  const filteredInvoices = allInvoices.filter(inv => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchSearch = !searchTerm ||
      (inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.clientName    || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const collectedPct = totalRevenue > 0 ? Math.round(paidRevenue / totalRevenue * 100) : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab="facturas" onTabChange={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Facturación</h1>
                <p className="text-sm text-muted-foreground mt-1">Emite, cobra y controla todas tus facturas en un solo sitio</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-10 px-4 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5 text-foreground">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  data-testid="btn-nueva-factura"
                  onClick={() => setShowForm(!showForm)}
                  className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm inline-flex items-center gap-1.5 hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Nueva factura
                </button>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total facturas</p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-primary" />
                  </div>
                </div>
                <p className="text-[1.75rem] font-bold text-foreground tracking-tight leading-none">{allInvoices.length}</p>
                <p className="text-[11px] text-muted-foreground">facturas emitidas</p>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Ingresos totales</p>
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={15} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-[1.75rem] font-bold text-foreground tracking-tight leading-none">{formatCurrency(totalRevenue)}</p>
                {totalRevenue > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${collectedPct}%` }} />
                    </div>
                    <p className="text-[11px] font-semibold text-muted-foreground">{collectedPct}%</p>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Pendientes de cobro</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                    <Clock size={15} className="text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-[1.75rem] font-bold text-foreground tracking-tight leading-none">{pendingCount}</p>
                <p className="text-[11px] text-muted-foreground">facturas pendientes</p>
              </div>

              <div className={`bg-card rounded-2xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${overdueCount > 0 ? "border border-red-200 dark:border-red-900/50 ring-1 ring-red-200 dark:ring-red-900/50" : "border border-border"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>Vencidas</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${overdueCount > 0 ? "bg-red-100 dark:bg-red-950/40" : "bg-muted"}`}>
                    <AlertTriangle size={15} className={overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"} />
                  </div>
                </div>
                <p className={`text-[1.75rem] font-bold tracking-tight leading-none ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{overdueCount}</p>
                <p className="text-[11px] text-muted-foreground">facturas vencidas</p>
              </div>
            </div>

            {/* New invoice form */}
            {showForm && (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground tracking-tight">Nueva factura</h2>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">Datos del emisor</p>
                      <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-foreground">{user?.company || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Tu empresa"}</p>
                        <p className="text-xs text-muted-foreground">NIF: {user?.dniNif || "-"}</p>
                        <p className="text-xs text-muted-foreground">{user?.address || ""}{user?.city ? `, ${user.city}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || "-"}</p>
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
                      <input data-testid="input-description" className={INPUT_CLS} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Certificado de eficiencia energética - Vivienda unifamiliar" />
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
              </div>
            )}

            {/* Invoices table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FILTER_TABS.map(tab => (
                      <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          statusFilter === tab.value
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40"
                        }`}
                      >
                        {tab.label}
                        <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                          statusFilter === tab.value ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                        }`}>
                          {countByStatus(tab.value)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar nº o cliente…"
                      className="h-9 pl-9 pr-3 w-52 bg-muted/40 border border-transparent rounded-full text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
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
                      : "Crea tu primera factura haciendo clic en \"Nueva factura\""}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Nº Factura</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Cliente</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hidden md:table-cell">Descripción</th>
                        <th className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Importe</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hidden sm:table-cell">Fecha</th>
                        <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.map((inv: any) => {
                        const st = getStatus(inv);
                        return (
                          <tr key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-muted/40 transition-colors cursor-pointer">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-foreground text-xs font-mono">{inv.invoiceNumber}</p>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                                  {initials(inv.clientName || "")}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate max-w-[140px]">{inv.clientName}</p>
                                  {inv.clientDni && <p className="text-[11px] text-muted-foreground">{inv.clientDni}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-muted-foreground hidden md:table-cell max-w-xs">
                              <p className="truncate">{inv.description || "—"}</p>
                            </td>
                            <td className="px-3 py-4 text-right">
                              <p className="font-bold text-foreground tabular-nums">{formatCurrency(inv.totalAmount)}</p>
                              <p className="text-[11px] text-muted-foreground">IVA: {formatCurrency(inv.tax)}</p>
                            </td>
                            <td className="px-3 py-4 text-sm text-muted-foreground hidden sm:table-cell">{formatDate(inv.issuedAt)}</td>
                            <td className="px-3 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dotCls}`} />
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredInvoices.length > 0 && (
                <div className="px-5 py-3.5 border-t border-border bg-muted/30 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Mostrando <span className="font-semibold text-foreground">{filteredInvoices.length}</span> de {allInvoices.length} facturas
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
