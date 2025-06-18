import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

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
  paymentTerms?: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description: string;
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
  userId: string;
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

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Sesión expirada",
        description: "Redirigiendo al login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Queries
  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial/summary", dateRange],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices", dateRange, paymentStatusFilter],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments", dateRange],
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["/api/collections", dateRange, categoryFilter],
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowInvoiceDialog(false);
      setEditingInvoice(null);
      toast({
        title: "Factura creada",
        description: "La factura se ha creado correctamente.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sesión expirada",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error al crear factura",
        description: "No se pudo crear la factura. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowInvoiceDialog(false);
      setEditingInvoice(null);
      toast({
        title: "Factura actualizada",
        description: "La factura se ha actualizado correctamente.",
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente",
      });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/collections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowCollectionDialog(false);
      toast({
        title: "Cobro registrado",
        description: "El cobro se ha registrado correctamente.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sesión expirada",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error al registrar cobro",
        description: "No se pudo registrar el cobro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const exportToExcelMutation = useMutation({
    mutationFn: (type: 'invoices' | 'payments' | 'collections' | 'complete') => 
      apiRequest("POST", `/api/export/${type}`, { dateRange }),
    onSuccess: () => {
      toast({
        title: "Exportación completada",
        description: "El archivo Excel se ha descargado correctamente",
      });
    },
  });

  // Financial calculations
  const summary: FinancialSummary = financialSummary || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalCollections: 0,
    netIncome: 0,
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    revenueGrowth: 0,
  };

  // Filter data
  const filteredInvoices = (invoices as Invoice[]).filter((invoice: Invoice) => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredCollections = (collections as Collection[]).filter((collection: Collection) => {
    const matchesSearch = collection.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (collection.clientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (collection.paymentReference?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Informes Financieros
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestión completa de facturas, pagos y cobros
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">Total Facturado</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {summary.totalInvoiced.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Cobrado</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {summary.totalPaid.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Pendiente</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {summary.totalPending.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </p>
                </div>
                <div className="p-3 bg-orange-500 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Crecimiento</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {summary.revenueGrowth > 0 ? '+' : ''}{summary.revenueGrowth.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full">
                  {summary.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-white" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar facturas, cobros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="collections">Cobros</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Facturas
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowInvoiceDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Factura
                    </Button>
                    <Button
                      onClick={() => exportToExcelMutation.mutate('invoices')}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InvoicesTable 
                  invoices={filteredInvoices.slice(0, 10)} 
                  onEdit={setEditingInvoice}
                  onRecordPayment={(invoice) => {
                    recordPaymentMutation.mutate({
                      invoiceId: invoice.id,
                      amount: parseFloat(invoice.total) - parseFloat(invoice.paidDate || "0"),
                      paymentMethod: "transfer",
                      paymentDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Pagos Recibidos
                  </CardTitle>
                  <Button
                    onClick={() => exportToExcelMutation.mutate('payments')}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PaymentsTable payments={payments as Payment[]} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Cobros
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Gestión de cobros e ingresos del negocio
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[160px]">
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
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Nuevo Cobro
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Registrar Nuevo Cobro</DialogTitle>
                        </DialogHeader>
                        <CollectionForm 
                          onSubmit={createCollectionMutation.mutate}
                          onCancel={() => setShowCollectionDialog(false)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => exportToExcelMutation.mutate('collections')}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CollectionsTable collections={filteredCollections} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Ingresos Mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="income" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-500" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-slate-500">Datos de análisis disponibles próximamente</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? "Editar Factura" : "Nueva Factura"}
              </DialogTitle>
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
              onCancel={() => {
                setShowInvoiceDialog(false);
                setEditingInvoice(null);
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}

// Component functions
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
      dueDate: new Date(Date.now() + formData.paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentStatus: "pending"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Cliente *</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentMethod">Método de Pago</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="invoiceType">Tipo de Factura</Label>
          <Select
            value={formData.isProforma ? "proforma" : "invoice"}
            onValueChange={(value) => setFormData({ 
              ...formData, 
              isProforma: value === "proforma",
              invoiceType: value === "proforma" ? "proforma" : "invoice"
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de factura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Factura</SelectItem>
              <SelectItem value="proforma">Factura Proforma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.paymentMethod === 'cash' && !formData.isProforma && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Registro contable manual:</strong> Las facturas con pago en efectivo requieren registro contable manual por parte del certificador.
            </p>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="subtotal">Subtotal *</Label>
          <Input
            id="subtotal"
            type="number"
            step="0.01"
            value={formData.subtotal}
            onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="vatRate">IVA (%)</Label>
          <Select value={formData.vatRate} onValueChange={(value) => setFormData({ ...formData, vatRate: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
          <Input
            id="paymentTerms"
            type="number"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {invoice ? "Actualizar" : "Crear"} Factura
        </Button>
      </div>
    </form>
  );
}

function InvoicesTable({ invoices, onEdit, onRecordPayment }: {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>{invoice.clientName}</TableCell>
            <TableCell>
              {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell className="font-semibold">
              {parseFloat(invoice.total).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR'
              })}
            </TableCell>
            <TableCell>
              <Badge 
                variant={invoice.paymentStatus === 'paid' ? 'default' : 
                        invoice.paymentStatus === 'overdue' ? 'destructive' : 'secondary'}
              >
                {invoice.paymentStatus === 'paid' ? 'Pagado' :
                 invoice.paymentStatus === 'overdue' ? 'Vencido' : 'Pendiente'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(invoice)}>
                  Editar
                </Button>
                {invoice.paymentStatus !== 'paid' && (
                  <Button variant="outline" size="sm" onClick={() => onRecordPayment(invoice)}>
                    Registrar Pago
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Referencia</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
            <TableCell>{payment.paymentReference || "-"}</TableCell>
            <TableCell className="font-semibold">
              {parseFloat(payment.amount).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR'
              })}
            </TableCell>
            <TableCell>
              <Badge variant="default">
                {payment.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CollectionsTable({ collections }: { collections: Collection[] }) {
  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      cash: { color: "bg-green-100 text-green-800", label: "Efectivo", icon: Euro },
      card: { color: "bg-blue-100 text-blue-800", label: "Tarjeta", icon: CreditCard },
      transfer: { color: "bg-purple-100 text-purple-800", label: "Transferencia", icon: Building2 },
      bizum: { color: "bg-orange-100 text-orange-800", label: "Bizum", icon: Smartphone },
      stripe: { color: "bg-indigo-100 text-indigo-800", label: "Stripe", icon: CreditCard },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.cash;
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: "bg-green-100 text-green-800", label: "Confirmado", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendiente", icon: Clock },
      failed: { color: "bg-red-100 text-red-800", label: "Fallido", icon: AlertCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {collections.map((collection) => (
          <TableRow key={collection.id}>
            <TableCell>
              {format(new Date(collection.collectionDate), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell className="font-medium">{collection.concept}</TableCell>
            <TableCell>{collection.clientName || "-"}</TableCell>
            <TableCell>
              {getPaymentMethodBadge(collection.paymentMethod)}
            </TableCell>
            <TableCell className="font-semibold">
              {parseFloat(collection.amount).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR'
              })}
            </TableCell>
            <TableCell>
              {getStatusBadge(collection.status)}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Ver detalles
                </Button>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CollectionForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: "",
    concept: "",
    paymentMethod: "cash",
    paymentReference: "",
    collectionDate: format(new Date(), "yyyy-MM-dd"),
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    vatIncluded: true,
    vatRate: "21.00",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const vatAmount = formData.vatIncluded 
      ? (amount * parseFloat(formData.vatRate)) / (100 + parseFloat(formData.vatRate))
      : 0;

    onSubmit({
      ...formData,
      amount: amount.toString(),
      vatAmount: vatAmount.toFixed(2),
      status: "confirmed"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Importe *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Método de pago *</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
        <Input
          id="concept"
          value={formData.concept}
          onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
          placeholder="Descripción del cobro"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="collectionDate">Fecha de cobro *</Label>
          <Input
            id="collectionDate"
            type="date"
            value={formData.collectionDate}
            onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="paymentReference">Referencia</Label>
          <Input
            id="paymentReference"
            value={formData.paymentReference}
            onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
            placeholder="Número de referencia"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="clientName">Cliente</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            placeholder="email@ejemplo.com"
          />
        </div>
        <div>
          <Label htmlFor="clientPhone">Teléfono</Label>
          <Input
            id="clientPhone"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            placeholder="Teléfono del cliente"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Registrar Cobro
        </Button>
      </div>
    </form>
  );
}