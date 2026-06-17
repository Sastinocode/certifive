import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard, SectionCard } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Download,
  Euro,
  FileText,
  Mail,
  Calendar as CalendarIcon,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Banknote,
  Smartphone,
  Building2,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Invoice {
  id: number;
  invoiceNumber: string;
  series: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNif?: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostalCode?: string;
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  irpfRate?: string;
  irpfAmount?: string;
  total: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentTerms?: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description: string;
  isProforma?: boolean;
  invoiceType?: string;
  isAccountingRegistered?: boolean;
  accountingRegisteredAt?: string;
  manualAccountingRequired?: boolean;
}

interface Payment {
  id: number;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  paymentReference?: string;
  status: string;
}

interface Collection {
  id: number;
  userId: number;
  amount: string;
  concept: string;
  paymentMethod: string;
  paymentReference?: string;
  collectionDate: string;
  invoiceId?: number;
  isInvoicePayment: boolean;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  bankAccount?: string;
  cardLastFour?: string;
  stripePaymentId?: string;
  vatIncluded: boolean;
  vatAmount: string;
  vatRate: string;
  status: string;
  verificationCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FinancialSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalCollections: number;
  netIncome: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
}

const fmtEur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState("current_month");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedTab, setSelectedTab] = useState("reports");

  const [searchType, setSearchType] = useState("payment_date");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Sesión expirada", description: "Redirigiendo al login...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: financialSummary } = useQuery({ queryKey: ["/api/financial/summary", dateRange] });
  const { data: invoices = [] } = useQuery({ queryKey: ["/api/invoices", dateRange, paymentStatusFilter] });
  const { data: payments = [] } = useQuery({ queryKey: ["/api/payments", dateRange] });
  const { data: collections = [] } = useQuery({ queryKey: ["/api/collections", dateRange, categoryFilter] });
  const { data: managerData = [] } = useQuery({
    queryKey: ["/api/manager/financial-records", searchType, paymentMethodFilter, invoiceStatusFilter, dateFrom, dateTo],
  }) as { data: any[] };

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowInvoiceDialog(false);
      setEditingInvoice(null);
      toast({ title: "Factura creada", description: "La factura se ha creado correctamente." });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Sesión expirada", description: "Redirigiendo al login...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Error al crear factura", description: "No se pudo crear la factura.", variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowInvoiceDialog(false);
      setEditingInvoice(null);
      toast({ title: "Factura actualizada", description: "La factura se ha actualizado correctamente." });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      toast({ title: "Pago registrado", description: "El pago se ha registrado correctamente" });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/collections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowCollectionDialog(false);
      toast({ title: "Cobro registrado", description: "El cobro se ha registrado correctamente." });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Sesión expirada", description: "Redirigiendo al login...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Error al registrar cobro", description: "No se pudo registrar el cobro.", variant: "destructive" });
    },
  });

  const exportToExcelMutation = useMutation({
    mutationFn: (type: 'invoices' | 'payments' | 'collections' | 'complete') =>
      apiRequest("POST", `/api/export/${type}`, { dateRange }),
    onSuccess: () => {
      toast({ title: "Exportación completada", description: "El archivo Excel se ha descargado correctamente" });
    },
  });

  const createInvoiceFromCollectionMutation = useMutation({
    mutationFn: (collectionId: number) => apiRequest("POST", `/api/collections/${collectionId}/create-invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/financial-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Factura creada", description: "La factura se ha generado a partir del cobro en efectivo." });
    },
    onError: () => {
      toast({ title: "Error al crear factura", description: "No se pudo generar la factura del cobro.", variant: "destructive" });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (collectionId: number) => apiRequest("DELETE", `/api/collections/${collectionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/financial-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Cobro eliminado", description: "El cobro en efectivo se ha eliminado correctamente." });
    },
    onError: () => {
      toast({ title: "Error al eliminar", description: "No se pudo eliminar el cobro.", variant: "destructive" });
    },
  });

  const summary: FinancialSummary = (financialSummary as FinancialSummary) || {
    totalInvoiced: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0,
    totalCollections: 0, netIncome: 0, currentMonthRevenue: 0,
    previousMonthRevenue: 0, revenueGrowth: 0,
  };

  const filteredInvoices = (invoices as Invoice[]).filter((invoice: Invoice) =>
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCollections = (collections as Collection[]).filter((collection: Collection) =>
    collection.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (collection.clientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (collection.paymentReference?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString("es-ES", { month: "short" }),
      facturado: 0,
      cobrado: 0,
    }));
    (invoices as Invoice[]).forEach((inv) => {
      const d = new Date(inv.issueDate);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth();
      months[m].facturado += parseFloat(inv.total) || 0;
      if (inv.paymentStatus === "paid") months[m].cobrado += parseFloat(inv.total) || 0;
    });
    return months;
  }, [invoices]);

  const statusData = useMemo(() => {
    const inv = invoices as Invoice[];
    const paid    = inv.filter((i) => i.paymentStatus === "paid").length;
    const pending = inv.filter((i) => i.paymentStatus === "pending").length;
    const overdue = inv.filter((i) => i.paymentStatus === "overdue").length;
    return [
      { name: "Pagadas",    value: paid,    color: "#10b981" },
      { name: "Pendientes", value: pending, color: "#f59e0b" },
      { name: "Vencidas",   value: overdue, color: "#ef4444" },
    ].filter((s) => s.value > 0);
  }, [invoices]);

  const propertyTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    (invoices as Invoice[]).forEach((inv) => {
      const desc = (inv.description || "").toLowerCase();
      let type = "Otros";
      if (/piso|vivienda|apartamento/.test(desc))     type = "Vivienda";
      else if (/chalet|casa|unifamiliar/.test(desc))  type = "Casa unifamiliar";
      else if (/local|comercial/.test(desc))          type = "Local comercial";
      else if (/oficina/.test(desc))                  type = "Oficina";
      else if (/nave|industrial/.test(desc))          type = "Industrial";
      counts[type] = (counts[type] || 0) + 1;
    });
    const palette = ["#6366f1", "#8b5cf6", "#a78bfa", "#818cf8", "#c4b5fd", "#ddd6fe"];
    return Object.entries(counts).map(([name, value], i) => ({
      name, value, color: palette[i % palette.length],
    }));
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1400px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Informes financieros</h1>
              <p className="text-sm text-muted-foreground mt-1">Gestión completa de facturas, pagos y cobros</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                <FileText className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Total facturado</p>
                <p className="text-[2.25rem] font-bold text-foreground tracking-tight leading-none">{fmtEur(summary.totalInvoiced)}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500 shadow-sm">
                <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Total cobrado</p>
                <p className="text-[2.25rem] font-bold text-foreground tracking-tight leading-none">{fmtEur(summary.totalPaid)}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500 shadow-sm">
                <Clock className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Pendiente</p>
                <p className="text-[2.25rem] font-bold text-foreground tracking-tight leading-none">{fmtEur(summary.totalPending)}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-500 shadow-sm">
                  {summary.revenueGrowth >= 0 ? <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.2} /> : <TrendingDown className="w-5 h-5 text-white" strokeWidth={2.2} />}
                </div>
                {summary.revenueGrowth !== 0 && (
                  <span className={`inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                    summary.revenueGrowth > 0
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                      : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                  }`}>
                    {summary.revenueGrowth > 0 ? "↑" : "↓"} vs anterior
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Crecimiento</p>
                <p className="text-[2.25rem] font-bold text-foreground tracking-tight leading-none">
                  {summary.revenueGrowth > 0 ? "+" : ""}{summary.revenueGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* ── Filters ──────────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar facturas, cobros…"
                className="w-full h-11 pl-10 pr-4 bg-muted/40 border border-transparent rounded-xl text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-border text-foreground"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-11 px-4 bg-muted/40 border-transparent rounded-xl text-sm font-medium w-full sm:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mes actual</SelectItem>
                <SelectItem value="last_month">Mes anterior</SelectItem>
                <SelectItem value="current_year">Año actual</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="h-11 px-4 bg-muted/40 border-transparent rounded-xl text-sm font-medium w-full sm:w-[160px]">
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <Tabs defaultValue="invoices" className="space-y-5">
            <TabsList className="grid w-full grid-cols-5 bg-card border border-border rounded-xl p-1 h-auto gap-1">
              {["invoices", "collections", "payments", "manager", "analytics"].map((v, i) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="rounded-lg text-sm font-medium py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground transition-colors"
                >
                  {["Facturas", "Cobros", "Informes", "Contabilidad", "Analíticas"][i]}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Invoices ──────────────────────────────────────────────── */}
            <TabsContent value="invoices">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Facturas</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Listado de facturas emitidas</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowInvoiceDialog(true)}
                      className="rounded-full shadow-sm bg-primary text-primary-foreground px-4 h-10 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />Nueva factura
                    </button>
                    <button
                      onClick={() => exportToExcelMutation.mutate("invoices")}
                      className="rounded-full bg-card border border-border px-4 h-10 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <Download className="w-4 h-4" />Exportar
                    </button>
                  </div>
                </div>

                {filteredInvoices.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={<FileText />}
                      title="Sin facturas"
                      description="Aún no has generado ninguna factura. Crea la primera desde el botón «Nueva Factura»."
                      action={{ label: "Nueva factura", onClick: () => setShowInvoiceDialog(true), icon: <Plus className="w-4 h-4" /> }}
                      size="compact"
                    />
                  </div>
                ) : (
                  <InvoicesTable
                    invoices={filteredInvoices.slice(0, 10)}
                    onEdit={setEditingInvoice}
                    onRecordPayment={(invoice) => {
                      recordPaymentMutation.mutate({
                        invoiceId: invoice.id,
                        amount: parseFloat(invoice.total) || 0,
                        paymentMethod: "transfer",
                        paymentDate: new Date().toISOString().split("T")[0],
                      });
                    }}
                  />
                )}
              </div>
            </TabsContent>

            {/* ── Collections ───────────────────────────────────────────── */}
            <TabsContent value="collections">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={18} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Cobros</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Gestión de cobros e ingresos del negocio</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-9 bg-muted/40 border-transparent rounded-xl text-sm w-[160px]">
                        <SelectValue placeholder="Método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="bizum">Bizum</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
                      <DialogTrigger asChild>
                        <button className="rounded-full bg-primary text-primary-foreground px-4 h-9 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm">
                          <Plus className="w-4 h-4" />Nuevo Cobro
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Registrar Nuevo Cobro</DialogTitle>
                        </DialogHeader>
                        <CollectionForm onSubmit={createCollectionMutation.mutate} onCancel={() => setShowCollectionDialog(false)} />
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => exportToExcelMutation.mutate("collections")}
                      className="rounded-full bg-card border border-border px-4 h-9 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <Download className="w-4 h-4" />Exportar
                    </button>
                  </div>
                </div>
                <CollectionsTable collections={filteredCollections} />
              </div>
            </TabsContent>

            {/* ── Payments ──────────────────────────────────────────────── */}
            <TabsContent value="payments">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Informes</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Historial de pagos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToExcelMutation.mutate("payments")}
                    className="rounded-full bg-card border border-border px-4 h-10 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <Download className="w-4 h-4" />Exportar
                  </button>
                </div>
                <PaymentsTable payments={payments as Payment[]} />
              </div>
            </TabsContent>

            {/* ── Manager ───────────────────────────────────────────────── */}
            <TabsContent value="manager">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Gestor — pagos, fiscal y contable</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Vista completa de registros financieros con control de facturación</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToExcelMutation.mutate("complete")}
                    className="rounded-full bg-card border border-border px-4 h-10 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <Download className="w-4 h-4" />Exportar todo
                  </button>
                </div>

                <div className="px-6 pb-6 space-y-5">
                  {/* Filtros avanzados */}
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor="searchType" className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">Tipo de búsqueda</Label>
                        <Select value={searchType} onValueChange={setSearchType}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="payment_date">Fecha de pago</SelectItem>
                            <SelectItem value="invoice_date">Fecha de factura</SelectItem>
                            <SelectItem value="due_date">Fecha de vencimiento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="paymentMethodFilter" className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">Formas de pago</Label>
                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="[Todas]" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">[Todas]</SelectItem>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="bizum">Bizum</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="invoiceStatusFilter" className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">Estado facturación</Label>
                        <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="[Todos]" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">[Todos]</SelectItem>
                            <SelectItem value="invoiced">Factura generada</SelectItem>
                            <SelectItem value="not_invoiced">Sin Factura</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="dateFrom" className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">Desde (Pago)</Label>
                        <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="dateTo" className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">Hasta (Pago)</Label>
                        <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                    <button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold transition-colors"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/manager/financial-records"] })}
                    >
                      Filtrar
                    </button>
                  </div>

                  <ManagerFinancialTable
                    data={managerData}
                    onCreateInvoice={createInvoiceFromCollectionMutation.mutate}
                    onDeleteCollection={deleteCollectionMutation.mutate}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── Analíticas ────────────────────────────────────────────── */}
            <TabsContent value="analytics" className="space-y-4">
              {/* ── Evolución mensual ─────────────────────────────────────────── */}
              <SectionCard title="Evolución mensual" icon={<BarChart3 size={18} />}>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${v.toLocaleString("es-ES")}€`}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                      />
                      <Tooltip
                        formatter={(v: number) => [fmtEur(v), ""]}
                        contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                      />
                      <Legend iconType="circle" iconSize={8} />
                      <Bar dataKey="facturado" name="Facturado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cobrado"   name="Cobrado"   fill="hsl(var(--primary))" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* ── Por estado + Por tipo de inmueble ───────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <SectionCard title="Por estado" icon={<PieChart size={18} />}>
                  {statusData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Sin datos en el período</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                              {statusData.map((s) => (
                                <Cell key={s.name} fill={s.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: number, name: string) => [`${v} facturas`, name]}
                              contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 pb-1">
                        {statusData.map((s) => (
                          <div key={s.name} className="flex items-center gap-2 text-sm">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            <span className="text-muted-foreground">{s.name}</span>
                            <span className="font-semibold text-foreground">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Por tipo de inmueble" icon={<Building2 size={18} />}>
                  {propertyTypeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Sin datos en el período</p>
                  ) : (
                    <div className="flex flex-col gap-3 py-1">
                      {propertyTypeData.map((p) => {
                        const max = Math.max(...propertyTypeData.map((d) => d.value));
                        return (
                          <div key={p.name} className="flex items-center gap-3">
                            <span className="w-28 text-xs text-muted-foreground shrink-0 text-right">{p.name}</span>
                            <div className="flex-1 h-6 bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${(p.value / max) * 100}%`, background: p.color }}
                              />
                            </div>
                            <span className="w-8 text-xs font-semibold text-foreground text-right">{p.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>

              </div>
            </TabsContent>

          </Tabs>

          {/* ── Invoice dialog ──────────────────────────────────────────── */}
          <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{editingInvoice ? "Editar Factura" : "Nueva Factura"}</DialogTitle>
              </DialogHeader>
              <InvoiceForm
                invoice={editingInvoice}
                onSubmit={(data) => {
                  if (editingInvoice) {
                    updateInvoiceMutation.mutate({ id: editingInvoice.id, data });
                  } else {
                    createInvoiceMutation.mutate(data);
                  }
                }}
                onCancel={() => { setShowInvoiceDialog(false); setEditingInvoice(null); }}
              />
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}

// ─── InvoiceForm ─────────────────────────────────────────────────────────────

function InvoiceForm({ invoice, onSubmit, onCancel }: {
  invoice?: Invoice | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    clientName: invoice?.clientName || "",
    clientEmail: invoice?.clientEmail || "",
    clientPhone: invoice?.clientPhone || "",
    description: invoice?.description || "",
    subtotal: invoice?.subtotal || "",
    vatRate: invoice?.vatRate || "21",
    paymentTerms: invoice?.paymentTerms || 30,
    paymentMethod: invoice?.paymentMethod || "transfer",
    issueDate: invoice?.issueDate || format(new Date(), "yyyy-MM-dd"),
    isProforma: invoice?.isProforma || false,
    invoiceType: invoice?.invoiceType || "invoice",
    series: invoice?.series || "CERT",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = parseFloat(formData.subtotal);
    const vatRate = parseFloat(formData.vatRate);
    const vatAmount = (subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;
    onSubmit({
      ...formData,
      subtotal: subtotal.toString(),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      dueDate: new Date(Date.now() + formData.paymentTerms * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      paymentStatus: "pending",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Cliente *</Label>
          <Input id="clientName" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input id="clientEmail" type="email" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Método de Pago</Label>
          <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de Factura</Label>
          <Select
            value={formData.isProforma ? "proforma" : "invoice"}
            onValueChange={(v) => setFormData({ ...formData, isProforma: v === "proforma", invoiceType: v === "proforma" ? "proforma" : "invoice" })}
          >
            <SelectTrigger><SelectValue placeholder="Tipo de factura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Factura</SelectItem>
              <SelectItem value="proforma">Factura Proforma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {formData.paymentMethod === "cash" && !formData.isProforma && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Registro contable manual:</strong> Las facturas con pago en efectivo requieren registro contable manual.
            </p>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="description">Descripción *</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="subtotal">Subtotal *</Label>
          <Input id="subtotal" type="number" step="0.01" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} required />
        </div>
        <div>
          <Label>IVA (%)</Label>
          <Select value={formData.vatRate} onValueChange={(v) => setFormData({ ...formData, vatRate: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0%</SelectItem>
              <SelectItem value="4">4%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="21">21%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="paymentTerms">Vencimiento (días)</Label>
          <Input id="paymentTerms" type="number" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{invoice ? "Actualizar" : "Crear"} Factura</Button>
      </div>
    </form>
  );
}

// ─── InvoicesTable ────────────────────────────────────────────────────────────

function InvoicesTable({ invoices, onEdit, onRecordPayment }: {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}) {
  const { toast } = useToast();

  const registerAccountingMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/register-accounting`),
    onSuccess: () => {
      toast({ title: "Registro contable completado", description: "La factura se ha registrado en contabilidad correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: () => {
      toast({ title: "Error al registrar", description: "No se pudo registrar la factura en contabilidad", variant: "destructive" });
    },
  });

  const convertProformaMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/convert-to-invoice`),
    onSuccess: () => {
      toast({ title: "Factura convertida", description: "La factura proforma se ha convertido a factura oficial" });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: () => {
      toast({ title: "Error al convertir", description: "No se pudo convertir la factura proforma", variant: "destructive" });
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Número", "Tipo", "Cliente", "Fecha", "Total", "Estado", "Contabilidad", "Acciones"].map((h) => (
              <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-border hover:bg-muted/40 transition-colors">
              <td className="px-6 py-4 font-medium text-foreground">{invoice.invoiceNumber}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  invoice.isProforma
                    ? "border border-border bg-card text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}>
                  {invoice.isProforma ? "Proforma" : "Factura"}
                </span>
              </td>
              <td className="px-6 py-4 text-foreground">{invoice.clientName}</td>
              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: es })}
              </td>
              <td className="px-6 py-4 font-semibold text-foreground">
                {parseFloat(invoice.total).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  invoice.paymentStatus === "paid"
                    ? "bg-primary text-primary-foreground"
                    : invoice.paymentStatus === "overdue"
                      ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {invoice.paymentStatus === "paid" ? "Pagado" : invoice.paymentStatus === "overdue" ? "Vencido" : "Pendiente"}
                </span>
              </td>
              <td className="px-6 py-4">
                {invoice.isAccountingRegistered ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle className="w-3 h-3" />Registrado
                  </span>
                ) : invoice.manualAccountingRequired ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
                      <Clock className="w-3 h-3" />Pendiente
                    </span>
                    <button
                      className="h-6 px-2 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 transition-colors"
                      onClick={() => registerAccountingMutation.mutate(invoice.id)}
                      disabled={registerAccountingMutation.isPending}
                    >
                      Registrar
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    <CheckCircle className="w-3 h-3" />Automático
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => onEdit(invoice)} className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 transition-colors inline-flex items-center gap-1">
                    <Edit className="w-3 h-3" />Editar
                  </button>
                  {invoice.isProforma && (
                    <button
                      onClick={() => convertProformaMutation.mutate(invoice.id)}
                      disabled={convertProformaMutation.isPending}
                      className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />Convertir
                    </button>
                  )}
                  {invoice.paymentStatus !== "paid" && !invoice.isProforma && (
                    <button onClick={() => onRecordPayment(invoice)} className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 transition-colors inline-flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />Pago
                    </button>
                  )}
                  <button className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 transition-colors inline-flex items-center gap-1">
                    <Download className="w-3 h-3" />PDF
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── PaymentsTable ────────────────────────────────────────────────────────────

function PaymentsTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="p-6">
        <EmptyState icon={<CheckCircle />} title="Sin pagos registrados" description="Los pagos recibidos aparecerán aquí." size="compact" />
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Fecha", "Método", "Referencia", "Importe", "Estado"].map((h) => (
              <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-border hover:bg-muted/40 transition-colors">
              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: es })}
              </td>
              <td className="px-6 py-4 capitalize text-foreground">{payment.paymentMethod}</td>
              <td className="px-6 py-4 text-muted-foreground">{payment.paymentReference || "—"}</td>
              <td className="px-6 py-4 font-semibold text-foreground">
                {parseFloat(payment.amount).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  payment.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {payment.status === "confirmed" ? "Confirmado" : "Pendiente"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ManagerFinancialTable ────────────────────────────────────────────────────

function ManagerFinancialTable({ data, onCreateInvoice, onDeleteCollection }: {
  data: any[];
  onCreateInvoice: (collectionId: number) => void;
  onDeleteCollection: (collectionId: number) => void;
}) {
  const METHOD_CONFIG: Record<string, { cls: string; label: string; Icon: any }> = {
    cash:     { cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",    label: "Efectivo",       Icon: Euro      },
    card:     { cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",        label: "Tarjeta",        Icon: CreditCard },
    transfer: { cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "Transferencia", Icon: Building2 },
    bizum:    { cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", label: "Bizum",         Icon: Smartphone },
    stripe:   { cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", label: "Stripe",        Icon: CreditCard },
  };

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="Sin registros financieros"
          description="No hay cobros ni facturas que coincidan con los filtros seleccionados."
          size="compact"
        />
      ) : (
        data.map((record) => {
          const method = METHOD_CONFIG[record.paymentMethod] ?? METHOD_CONFIG.cash;
          const Icon = method.Icon;
          const initial = (record.clientName ?? "C").charAt(0).toUpperCase();
          const hasInvoice = !!record.invoiceId;
          const isCashNoInvoice = record.type === "collection" && record.paymentMethod === "cash" && !record.invoiceId;
          const isCollection = record.type === "collection";

          return (
            <div key={`${record.type}-${record.id}`} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">

                {/* Cliente */}
                <div className="flex items-center gap-3 lg:w-56 flex-shrink-0">
                  <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-primary">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{record.clientName || "Cliente"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${method.cls}`}>
                        <Icon className="w-3 h-3" />{method.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Datos centrales */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Pagó</p>
                      <p className="font-semibold text-foreground mt-1">
                        {format(new Date(record.paymentDate || record.collectionDate), "dd/MM/yyyy", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.paymentDate || record.collectionDate), "HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {record.type === "invoice" ? "Fiscal" : "Corresponde"}
                      </p>
                      <p className="font-semibold text-foreground mt-1">
                        {format(new Date(record.invoiceDate || record.collectionDate), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Importe</p>
                      <p className="text-xl font-bold text-foreground tracking-tight mt-0.5">
                        {parseFloat(record.amount || record.total).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-1">
                    {record.concept || record.description || "Certificación energética"}
                  </p>
                </div>

                {/* Estado y acciones */}
                <div className="flex flex-col items-start lg:items-end gap-2 lg:w-44 flex-shrink-0">
                  {hasInvoice ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle className="w-3 h-3" />Factura generada
                    </span>
                  ) : isCollection ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700">
                      <XCircle className="w-3 h-3" />Sin factura
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      <Clock className="w-3 h-3" />N/A
                    </span>
                  )}

                  <div className="flex gap-1.5">
                    {isCashNoInvoice ? (
                      <>
                        <button
                          onClick={() => onCreateInvoice(record.id)}
                          className="h-8 rounded-full text-xs font-medium border border-border bg-card text-primary hover:bg-primary/5 dark:hover:bg-primary/10 px-3 inline-flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3" />Crear factura
                        </button>
                        <button
                          onClick={() => onDeleteCollection(record.id)}
                          className="h-8 w-8 p-0 rounded-full border border-border bg-card text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="h-8 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 px-3 inline-flex items-center gap-1 transition-colors">
                          <Eye className="w-3 h-3" />Ver
                        </button>
                        <button className="h-8 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 px-3 inline-flex items-center gap-1 transition-colors">
                          <Download className="w-3 h-3" />PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── CollectionsTable ─────────────────────────────────────────────────────────

function CollectionsTable({ collections }: { collections: Collection[] }) {
  const METHOD_CONFIG: Record<string, { cls: string; label: string; Icon: any }> = {
    cash:     { cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",    label: "Efectivo",       Icon: Euro      },
    card:     { cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",        label: "Tarjeta",        Icon: CreditCard },
    transfer: { cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "Transferencia", Icon: Building2 },
    bizum:    { cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", label: "Bizum",         Icon: Smartphone },
    stripe:   { cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", label: "Stripe",        Icon: CreditCard },
  };
  const STATUS_CONFIG: Record<string, { cls: string; label: string; Icon: any }> = {
    confirmed: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300", label: "Confirmado", Icon: CheckCircle },
    pending:   { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",         label: "Pendiente",  Icon: Clock       },
    failed:    { cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",                 label: "Fallido",    Icon: AlertCircle },
  };

  if (collections.length === 0) {
    return (
      <div className="p-6">
        <EmptyState icon={<TrendingUp />} title="Sin cobros registrados" description="Los cobros aparecerán aquí." size="compact" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Fecha", "Concepto", "Cliente", "Método", "Importe", "Estado", "Acciones"].map((h) => (
              <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => {
            const method = METHOD_CONFIG[collection.paymentMethod] ?? METHOD_CONFIG.cash;
            const status = STATUS_CONFIG[collection.status] ?? STATUS_CONFIG.pending;
            const MethodIcon = method.Icon;
            const StatusIcon = status.Icon;
            return (
              <tr key={collection.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                  {format(new Date(collection.collectionDate), "dd/MM/yyyy", { locale: es })}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">{collection.concept}</td>
                <td className="px-6 py-4 text-foreground">{collection.clientName || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${method.cls}`}>
                    <MethodIcon className="w-3 h-3" />{method.label}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-foreground">
                  {parseFloat(collection.amount).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>
                    <StatusIcon className="w-3 h-3" />{status.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5">
                    <button className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 transition-colors">Ver detalles</button>
                    <button className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40 transition-colors">Editar</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── CollectionForm ───────────────────────────────────────────────────────────

function CollectionForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: "", concept: "", paymentMethod: "cash", paymentReference: "",
    collectionDate: format(new Date(), "yyyy-MM-dd"),
    clientName: "", clientEmail: "", clientPhone: "",
    vatIncluded: true, vatRate: "21.00", notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;
    const vatAmount = formData.vatIncluded
      ? (amount * parseFloat(formData.vatRate)) / (100 + parseFloat(formData.vatRate))
      : 0;
    onSubmit({ ...formData, amount: amount.toString(), vatAmount: vatAmount.toFixed(2), status: "confirmed" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Importe *</Label>
          <Input id="amount" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required />
        </div>
        <div>
          <Label>Método de pago *</Label>
          <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="bizum">Bizum</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="concept">Concepto *</Label>
        <Input id="concept" value={formData.concept} onChange={(e) => setFormData({ ...formData, concept: e.target.value })} placeholder="Descripción del cobro" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="collectionDate">Fecha de cobro *</Label>
          <Input id="collectionDate" type="date" value={formData.collectionDate} onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="paymentReference">Referencia</Label>
          <Input id="paymentReference" value={formData.paymentReference} onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })} placeholder="Número de referencia" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="clientName">Cliente</Label>
          <Input id="clientName" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="Nombre del cliente" />
        </div>
        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input id="clientEmail" type="email" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} placeholder="email@ejemplo.com" />
        </div>
        <div>
          <Label htmlFor="clientPhone">Teléfono</Label>
          <Input id="clientPhone" value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} placeholder="Teléfono del cliente" />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notas adicionales" rows={3} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Registrar Cobro</Button>
      </div>
    </form>
  );
}
