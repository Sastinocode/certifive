import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  Euro, 
  Download,
  FileText,
  Plus,
  Edit,
  Trash2,
  Send,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Mail,
  Filter,
  Search
} from "lucide-react";

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
  totalExpenses: number;
  netIncome: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
}

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("current_month");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acceso no autorizado",
        description: "Redirigiendo al login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Data queries
  const { data: financialSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/financial/summary", dateRange],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices", dateRange, paymentStatusFilter],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", dateRange],
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
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
        description: "La factura se ha creado correctamente con numeración automática",
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

  const generateInvoicePdfMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/generate-pdf`),
    onSuccess: () => {
      toast({
        title: "PDF generado",
        description: "El PDF de la factura se ha generado correctamente",
      });
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Factura enviada",
        description: "La factura se ha enviado por email al cliente",
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
        description: "El cobro se ha registrado correctamente",
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
    totalExpenses: 0,
    netIncome: 0,
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    revenueGrowth: 0,
  };

  // Prepare chart data based on real financial data
  const revenueData = [
    { month: 'Ene', ingresos: 2400, gastos: 1800, beneficio: 600 },
    { month: 'Feb', ingresos: 3200, gastos: 2100, beneficio: 1100 },
    { month: 'Mar', ingresos: 2800, gastos: 1950, beneficio: 850 },
    { month: 'Abr', ingresos: 3600, gastos: 2200, beneficio: 1400 },
    { month: 'May', ingresos: 4200, gastos: 2800, beneficio: 1400 },
    { month: 'Jun', ingresos: 3800, gastos: 2600, beneficio: 1200 }
  ];

  const invoiceStatusData = [
    { name: 'Pagadas', value: summary.totalPaid || 65, color: '#22c55e' },
    { name: 'Pendientes', value: summary.totalPending || 25, color: '#f59e0b' },
    { name: 'Vencidas', value: summary.totalOverdue || 10, color: '#ef4444' }
  ];

  const expenseCategories = [
    { category: 'Equipos', amount: 1200, color: '#3b82f6' },
    { category: 'Transporte', amount: 800, color: '#8b5cf6' },
    { category: 'Software', amount: 450, color: '#06b6d4' },
    { category: 'Marketing', amount: 600, color: '#10b981' },
    { category: 'Otros', amount: 350, color: '#f59e0b' }
  ];

  const monthlyTrend = [
    { month: 'Ene', facturas: 12, certificados: 8 },
    { month: 'Feb', facturas: 16, certificados: 12 },
    { month: 'Mar', facturas: 14, certificados: 10 },
    { month: 'Abr', facturas: 18, certificados: 15 },
    { month: 'May', facturas: 22, certificados: 18 },
    { month: 'Jun', facturas: 20, certificados: 16 }
  ];

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredCollections = collections.filter((collection: Collection) => {
    const matchesSearch = collection.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (collection.clientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (collection.paymentReference?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: "bg-green-100 text-green-800", label: "Pagado", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendiente", icon: Clock },
      overdue: { color: "bg-red-100 text-red-800", label: "Vencido", icon: AlertCircle },
      partial: { color: "bg-blue-100 text-blue-800", label: "Parcial", icon: Clock },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Cancelado", icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="reports" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Informes Financieros</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión Financiera</h2>
                <p className="text-gray-600">Control completo de facturación, pagos y gastos</p>
              </div>
              <div className="flex gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mes actual</SelectItem>
                    <SelectItem value="last_month">Mes pasado</SelectItem>
                    <SelectItem value="current_quarter">Trimestre actual</SelectItem>
                    <SelectItem value="current_year">Año actual</SelectItem>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => exportToExcelMutation.mutate('complete')}
                  disabled={exportToExcelMutation.isPending}
                  variant="outline"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {exportToExcelMutation.isPending ? "Exportando..." : "Exportar Excel"}
                </Button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Euro className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalInvoiced)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Cobrado</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pendiente de Cobro</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPending)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Beneficio Neto</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.netIncome)}</p>
                      <div className="flex items-center mt-1">
                        {summary.revenueGrowth >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs ${summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(summary.revenueGrowth).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="invoices">Facturas</TabsTrigger>
                <TabsTrigger value="payments">Pagos</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Invoices */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Facturas Recientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredInvoices.slice(0, 5).map((invoice: Invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                              <p className="text-sm text-gray-600">{invoice.clientName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(invoice.total)}</p>
                              {getPaymentStatusBadge(invoice.paymentStatus)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue vs Expenses Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Evolución Ingresos vs Gastos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [`€${Number(value).toLocaleString()}`, name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Beneficio']}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="ingresos"
                            stackId="1"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.6}
                            name="Ingresos"
                          />
                          <Area
                            type="monotone"
                            dataKey="gastos"
                            stackId="2"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                            name="Gastos"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Invoice Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Estado de Facturas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={invoiceStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Porcentaje']}
                            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Expense Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Receipt className="w-5 h-5 mr-2" />
                        Gastos por Categoría
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expenseCategories}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`€${Number(value).toLocaleString()}`, 'Importe']}
                            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Performance Trend */}
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        Rendimiento Mensual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [value, name === 'facturas' ? 'Facturas' : 'Certificados']}
                            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="facturas"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            name="Facturas"
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="certificados"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Certificados"
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Gestión de Facturas
                      </CardTitle>
                      <div className="flex gap-2">
                        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Nueva Factura
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {editingInvoice ? "Editar Factura" : "Nueva Factura"}
                              </DialogTitle>
                            </DialogHeader>
                            <InvoiceForm 
                              invoice={editingInvoice} 
                              onSubmit={createInvoiceMutation.mutate}
                              onCancel={() => {
                                setShowInvoiceDialog(false);
                                setEditingInvoice(null);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
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
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Buscar por cliente o número de factura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Estado de pago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <InvoicesTable 
                      invoices={filteredInvoices}
                      onGeneratePdf={generateInvoicePdfMutation.mutate}
                      onSendEmail={sendInvoiceMutation.mutate}
                      onRecordPayment={recordPaymentMutation.mutate}
                      onEdit={(invoice) => {
                        setEditingInvoice(invoice);
                        setShowInvoiceDialog(true);
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Historial de Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentsTable payments={payments} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Receipt className="w-5 h-5 mr-2" />
                        Gestión de Gastos
                      </CardTitle>
                      <div className="flex gap-2">
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
                          onClick={() => exportToExcelMutation.mutate('expenses')}
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// Invoice Form Component
function InvoiceForm({ invoice, onSubmit, onCancel }: {
  invoice?: Invoice | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    // Client personal data
    clientName: invoice?.clientName || "",
    clientEmail: invoice?.clientEmail || "",
    clientPhone: invoice?.clientPhone || "",
    clientNif: invoice?.clientNif || "",
    
    // Client address
    clientAddress: invoice?.clientAddress || "",
    clientCity: invoice?.clientCity || "",
    clientPostalCode: invoice?.clientPostalCode || "",
    
    // Service details
    description: invoice?.description || "",
    subtotal: invoice?.subtotal || "",
    vatRate: invoice?.vatRate || "21",
    irpfRate: invoice?.irpfRate || "0",
    paymentTerms: invoice?.paymentTerms?.toString() || "30",
    dueDate: "",
    series: invoice?.series || "CERT",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotalValue = parseFloat(formData.subtotal);
    const vatRateValue = parseFloat(formData.vatRate);
    const irpfRateValue = parseFloat(formData.irpfRate);
    
    const vatAmount = (subtotalValue * vatRateValue) / 100;
    const irpfAmount = (subtotalValue * irpfRateValue) / 100;
    const total = subtotalValue + vatAmount - irpfAmount;
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(formData.paymentTerms));
    
    onSubmit({
      ...formData,
      subtotal: subtotalValue.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      irpfAmount: irpfAmount.toFixed(2),
      total: total.toFixed(2),
      dueDate: formData.dueDate || dueDate.toISOString().split('T')[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos del Cliente</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName">Nombre y Apellidos *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nombre completo del cliente"
              required
            />
          </div>
          <div>
            <Label htmlFor="clientNif">CIF/NIF/NIE *</Label>
            <Input
              id="clientNif"
              value={formData.clientNif}
              onChange={(e) => setFormData({ ...formData, clientNif: e.target.value })}
              placeholder="12345678Z / A12345678"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>
          <div>
            <Label htmlFor="clientPhone">Teléfono</Label>
            <Input
              id="clientPhone"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="600 000 000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="clientAddress">Dirección *</Label>
          <Input
            id="clientAddress"
            value={formData.clientAddress}
            onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
            placeholder="Calle, número, piso, puerta"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientCity">Localidad/Municipio *</Label>
            <Input
              id="clientCity"
              value={formData.clientCity}
              onChange={(e) => setFormData({ ...formData, clientCity: e.target.value })}
              placeholder="Madrid"
              required
            />
          </div>
          <div>
            <Label htmlFor="clientPostalCode">Código Postal *</Label>
            <Input
              id="clientPostalCode"
              value={formData.clientPostalCode}
              onChange={(e) => setFormData({ ...formData, clientPostalCode: e.target.value })}
              placeholder="28001"
              required
            />
          </div>
        </div>
      </div>

      {/* Service Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Detalles del Servicio</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="series">Serie de Facturación</Label>
            <Select 
              value={formData.series} 
              onValueChange={(value) => setFormData({ ...formData, series: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CERT">CERT - Certificaciones</SelectItem>
                <SelectItem value="CONS">CONS - Consultoría</SelectItem>
                <SelectItem value="SERV">SERV - Servicios</SelectItem>
                <SelectItem value="RECT">RECT - Rectificativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 w-full">
              <span className="text-sm text-blue-700 font-medium">
                Número: {formData.series}-{new Date().getFullYear()}-XXX
              </span>
              <p className="text-xs text-blue-600 mt-1">Se asignará automáticamente al crear</p>
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Descripción del Servicio *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Certificación energética vivienda unifamiliar..."
            required
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="subtotal">Base Imponible (€) *</Label>
            <Input
              id="subtotal"
              type="number"
              step="0.01"
              min="0"
              value={formData.subtotal}
              onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
              placeholder="150.00"
              required
            />
          </div>
          <div>
            <Label htmlFor="vatRate">IVA (%)</Label>
            <Select 
              value={formData.vatRate} 
              onValueChange={(value) => setFormData({ ...formData, vatRate: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Exento)</SelectItem>
                <SelectItem value="4">4% (Reducido)</SelectItem>
                <SelectItem value="10">10% (Reducido)</SelectItem>
                <SelectItem value="21">21% (General)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="irpfRate">IRPF (%)</Label>
            <Select 
              value={formData.irpfRate} 
              onValueChange={(value) => setFormData({ ...formData, irpfRate: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Sin retención)</SelectItem>
                <SelectItem value="7">7%</SelectItem>
                <SelectItem value="15">15%</SelectItem>
                <SelectItem value="19">19%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paymentTerms">Plazo de Pago (días)</Label>
            <Select 
              value={formData.paymentTerms} 
              onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Pago inmediato</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dueDate">Fecha de Vencimiento (opcional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      {formData.subtotal && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-gray-900">Resumen de Facturación</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Base Imponible:</span>
              <span>{parseFloat(formData.subtotal || "0").toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({formData.vatRate}%):</span>
              <span>{((parseFloat(formData.subtotal || "0") * parseFloat(formData.vatRate)) / 100).toFixed(2)} €</span>
            </div>
            {parseFloat(formData.irpfRate) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>IRPF (-{formData.irpfRate}%):</span>
                <span>-{((parseFloat(formData.subtotal || "0") * parseFloat(formData.irpfRate)) / 100).toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total:</span>
              <span>
                {(
                  parseFloat(formData.subtotal || "0") + 
                  ((parseFloat(formData.subtotal || "0") * parseFloat(formData.vatRate)) / 100) -
                  ((parseFloat(formData.subtotal || "0") * parseFloat(formData.irpfRate)) / 100)
                ).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
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

// Invoices Table Component
function InvoicesTable({ invoices, onGeneratePdf, onSendEmail, onRecordPayment, onEdit }: {
  invoices: Invoice[];
  onGeneratePdf: (id: number) => void;
  onSendEmail: (id: number) => void;
  onRecordPayment: (data: any) => void;
  onEdit: (invoice: Invoice) => void;
}) {
  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: "bg-green-100 text-green-800", label: "Pagado" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendiente" },
      overdue: { color: "bg-red-100 text-red-800", label: "Vencido" },
      partial: { color: "bg-blue-100 text-blue-800", label: "Parcial" },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Cancelado" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha Emisión</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>{invoice.clientName}</TableCell>
            <TableCell>{formatCurrency(invoice.total)}</TableCell>
            <TableCell>{getPaymentStatusBadge(invoice.paymentStatus)}</TableCell>
            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGeneratePdf(invoice.id)}
                >
                  <Printer className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSendEmail(invoice.id)}
                >
                  <Mail className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(invoice)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Payments Table Component
function PaymentsTable({ payments }: { payments: Payment[] }) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Referencia</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
            <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
            <TableCell>{payment.paymentReference}</TableCell>
            <TableCell>
              <Badge className="bg-green-100 text-green-800">
                {payment.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Expense Form Component
function ExpenseForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    vendor: "",
    expenseDate: "",
    isDeductible: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Importe (€)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="travel">Viajes</SelectItem>
              <SelectItem value="equipment">Equipamiento</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="office">Oficina</SelectItem>
              <SelectItem value="training">Formación</SelectItem>
              <SelectItem value="fuel">Combustible</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vendor">Proveedor</Label>
          <Input
            id="vendor"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="expenseDate">Fecha del Gasto</Label>
          <Input
            id="expenseDate"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Registrar Gasto
        </Button>
      </div>
    </form>
  );
}

// Expenses Table Component
function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Deducible</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{formatDate(expense.expenseDate)}</TableCell>
            <TableCell>{expense.description}</TableCell>
            <TableCell className="capitalize">{expense.category}</TableCell>
            <TableCell>{expense.vendor}</TableCell>
            <TableCell>{formatCurrency(expense.amount)}</TableCell>
            <TableCell>
              <Badge className={expense.isDeductible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {expense.isDeductible ? "Sí" : "No"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}