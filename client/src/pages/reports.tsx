import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { apiRequest } from "@/lib/queryClient";
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
  clientName: string;
  clientEmail: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  paymentStatus: string;
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

interface FinancialSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  netIncome: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
}

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("current_month");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

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

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      setShowInvoiceDialog(false);
      toast({
        title: "Factura creada",
        description: "La factura se ha creado correctamente",
      });
    },
  });

  const generateInvoicePdfMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/pdf`),
    onSuccess: () => {
      toast({
        title: "PDF generado",
        description: "El PDF de la factura se ha generado correctamente",
      });
    },
  });

  const sendInvoiceEmailMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/send`),
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "La factura se ha enviado por email correctamente",
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente",
      });
    },
  });

  const exportToExcelMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/export/excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, dateRange }),
      });
      
      if (!response.ok) {
        throw new Error("Error al exportar datos");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `informes_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      return { url, filename };
    },
    onSuccess: (data) => {
      // Download the Excel file
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(data.url);
      
      toast({
        title: "Exportación completada",
        description: "El archivo Excel se ha descargado correctamente",
      });
    },
  });

  // Financial calculations
  const summary: FinancialSummary = (financialSummary as FinancialSummary) || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    netIncome: 0,
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    revenueGrowth: 0,
  };

  // Prepare chart data based on real financial data
  const revenueData = [
    { month: 'Ene', ingresos: 2400, beneficio: 2400 },
    { month: 'Feb', ingresos: 3200, beneficio: 3200 },
    { month: 'Mar', ingresos: 2800, beneficio: 2800 },
    { month: 'Abr', ingresos: 3600, beneficio: 3600 },
    { month: 'May', ingresos: 4200, beneficio: 4200 },
    { month: 'Jun', ingresos: 3800, beneficio: 3800 }
  ];

  const invoiceStatusData = [
    { name: 'Pagadas', value: summary.totalPaid || 65, color: '#22c55e' },
    { name: 'Pendientes', value: summary.totalPending || 25, color: '#f59e0b' },
    { name: 'Vencidas', value: summary.totalOverdue || 10, color: '#ef4444' }
  ];

  const monthlyTrend = [
    { month: 'Ene', facturas: 12, certificados: 8 },
    { month: 'Feb', facturas: 16, certificados: 12 },
    { month: 'Mar', facturas: 14, certificados: 10 },
    { month: 'Abr', facturas: 18, certificados: 15 },
    { month: 'May', facturas: 22, certificados: 18 },
    { month: 'Jun', facturas: 20, certificados: 16 }
  ];

  const filteredInvoices = (invoices as Invoice[]).filter((invoice: Invoice) => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Sidebar selectedTab="reports" onTabChange={() => {}} />
      <div className="ml-64 min-h-screen overflow-y-auto">
        <div className="p-6 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Informes Financieros
            </h1>
            <p className="text-gray-600">
              Gestiona tus facturas e ingresos con reportes detallados
            </p>
          </div>

          {/* Header Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes Actual</SelectItem>
                  <SelectItem value="last_month">Mes Anterior</SelectItem>
                  <SelectItem value="current_quarter">Trimestre Actual</SelectItem>
                  <SelectItem value="current_year">Año Actual</SelectItem>
                  <SelectItem value="all_time">Todo el Tiempo</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar facturas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <Button 
              onClick={() => exportToExcelMutation.mutate('all')}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Todo
            </Button>
          </div>

          <div className="space-y-6 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="overview" className="text-sm">Resumen</TabsTrigger>
                <TabsTrigger value="invoices" className="text-sm">Facturas</TabsTrigger>
                <TabsTrigger value="payments" className="text-sm">Pagos</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Facturado</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {formatCurrency(summary.totalInvoiced)}
                          </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ingresos Recibidos</p>
                          <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(summary.totalPaid)}
                          </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                          <Euro className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pendiente de Cobro</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {formatCurrency(summary.totalPending)}
                          </p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                          <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Crecimiento</p>
                          <p className={`text-3xl font-bold ${summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {summary.revenueGrowth >= 0 ? '+' : ''}{summary.revenueGrowth.toFixed(1)}%
                          </p>
                        </div>
                        <div className={`${summary.revenueGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
                          {summary.revenueGrowth >= 0 ? 
                            <TrendingUp className="w-6 h-6 text-green-600" /> :
                            <TrendingDown className="w-6 h-6 text-red-600" />
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Revenue Chart */}
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Evolución de Ingresos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Area 
                              type="monotone" 
                              dataKey="ingresos" 
                              stroke="#3b82f6" 
                              fill="#3b82f6" 
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice Status Chart */}
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-purple-600" />
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
                            label
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Invoices Preview */}
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Facturas Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº Factura</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.slice(0, 5).map((invoice: Invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.clientName}</TableCell>
                            <TableCell>{formatCurrency(invoice.total)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(invoice.paymentStatus)}</TableCell>
                            <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Gestión de Facturas
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los Estados</SelectItem>
                            <SelectItem value="paid">Pagadas</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="overdue">Vencidas</SelectItem>
                          </SelectContent>
                        </Select>
                        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Nueva Factura
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Crear Nueva Factura</DialogTitle>
                            </DialogHeader>
                            <InvoiceForm 
                              invoice={editingInvoice}
                              onSubmit={createInvoiceMutation.mutate}
                              onCancel={() => setShowInvoiceDialog(false)}
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
                    <InvoicesTable 
                      invoices={filteredInvoices} 
                      onGeneratePdf={generateInvoicePdfMutation.mutate}
                      onSendEmail={sendInvoiceEmailMutation.mutate}
                      onRecordPayment={recordPaymentMutation.mutate}
                      onEdit={(invoice) => {
                        setEditingInvoice(invoice);
                        setShowInvoiceDialog(true);
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Historial de Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentsTable payments={payments as Payment[]} />
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
    clientName: invoice?.clientName || "",
    clientEmail: invoice?.clientEmail || "",
    description: invoice?.description || "",
    subtotal: invoice?.subtotal || "",
    vatAmount: invoice?.vatAmount || "",
    total: invoice?.total || "",
    dueDate: invoice?.dueDate || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Nombre del Cliente</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="clientEmail">Email del Cliente</Label>
          <Input
            id="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            required
          />
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="subtotal">Subtotal (€)</Label>
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
          <Label htmlFor="vatAmount">IVA (€)</Label>
          <Input
            id="vatAmount"
            type="number"
            step="0.01"
            value={formData.vatAmount}
            onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="total">Total (€)</Label>
          <Input
            id="total"
            type="number"
            step="0.01"
            value={formData.total}
            onChange={(e) => setFormData({ ...formData, total: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          required
        />
      </div>
      
      <div className="flex justify-end gap-2">
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº Factura</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>{invoice.clientName}</TableCell>
            <TableCell className="max-w-xs truncate">{invoice.description}</TableCell>
            <TableCell>{formatCurrency(invoice.total)}</TableCell>
            <TableCell>{getPaymentStatusBadge(invoice.paymentStatus)}</TableCell>
            <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
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
                {invoice.paymentStatus !== 'paid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRecordPayment({ invoiceId: invoice.id, amount: invoice.total })}
                  >
                    <Euro className="w-3 h-3" />
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

// Payments Table Component
function PaymentsTable({ payments }: { payments: Payment[] }) {
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Factura</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Método de Pago</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Referencia</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.invoiceId}</TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
            <TableCell>{payment.paymentMethod}</TableCell>
            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
            <TableCell>{payment.paymentReference || "-"}</TableCell>
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