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
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Banknote,
  Smartphone,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedTab, setSelectedTab] = useState("reports");
  const [dateRange, setDateRange] = useState("current_month");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);

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

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/collections", dateRange, paymentMethodFilter],
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
    <div className="flex h-screen">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden backdrop-blur-md bg-white/70 border-b border-white/30 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Informes Financieros</h1>
        </div>

        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Gestión de Cobros
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Administra todos los cobros e ingresos de tu negocio
              </p>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Cobrado</CardTitle>
                  <Euro className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {filteredCollections.reduce((sum, c) => sum + parseFloat(c.amount), 0).toFixed(2)}€
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    +12.5% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Cobros del Mes</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {filteredCollections.filter(c => {
                      const collectionDate = new Date(c.collectionDate);
                      const now = new Date();
                      return collectionDate.getMonth() === now.getMonth() && 
                             collectionDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    8 cobros este mes
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Promedio por Cobro</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {filteredCollections.length > 0 
                      ? (filteredCollections.reduce((sum, c) => sum + parseFloat(c.amount), 0) / filteredCollections.length).toFixed(2)
                      : '0.00'
                    }€
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Valor promedio
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Método Preferido</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {(() => {
                      const methods = filteredCollections.reduce((acc, c) => {
                        acc[c.paymentMethod] = (acc[c.paymentMethod] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const mostUsed = Object.entries(methods).sort(([,a], [,b]) => b - a)[0];
                      const methodNames: Record<string, string> = {
                        cash: 'Efectivo',
                        card: 'Tarjeta',
                        transfer: 'Transferencia',
                        bizum: 'Bizum',
                        stripe: 'Stripe'
                      };
                      return mostUsed ? methodNames[mostUsed[0]] || mostUsed[0] : 'N/A';
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Más utilizado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Cobros por Método de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const methods = filteredCollections.reduce((acc, c) => {
                        acc[c.paymentMethod] = (acc[c.paymentMethod] || 0) + parseFloat(c.amount);
                        return acc;
                      }, {} as Record<string, number>);
                      const total = Object.values(methods).reduce((sum, amount) => sum + amount, 0);
                      const methodNames: Record<string, string> = {
                        cash: 'Efectivo',
                        card: 'Tarjeta',
                        transfer: 'Transferencia',
                        bizum: 'Bizum',
                        stripe: 'Stripe'
                      };
                      const methodIcons: Record<string, any> = {
                        cash: Banknote,
                        card: CreditCard,
                        transfer: Building2,
                        bizum: Smartphone,
                        stripe: CreditCard
                      };
                      return Object.entries(methods).map(([method, amount]) => {
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        const Icon = methodIcons[method] || CreditCard;
                        return (
                          <div key={method} className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-slate-500" />
                            <div className="flex-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{methodNames[method] || method}</span>
                                <span className="text-slate-600">{amount.toFixed(2)}€</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Evolución Mensual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const monthlyData = filteredCollections.reduce((acc, c) => {
                        const date = new Date(c.collectionDate);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        acc[monthKey] = (acc[monthKey] || 0) + parseFloat(c.amount);
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const months = Object.keys(monthlyData).sort().slice(-6);
                      const maxAmount = Math.max(...Object.values(monthlyData));
                      
                      return months.map(month => {
                        const amount = monthlyData[month];
                        const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                        const [year, monthNum] = month.split('-');
                        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                        
                        return (
                          <div key={month} className="flex items-center gap-3">
                            <div className="w-16 text-sm font-medium text-slate-600">
                              {monthName}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">{amount.toFixed(2)}€</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  const csvContent = [
                    'Fecha,Concepto,Cliente,Método,Importe,Referencia',
                    ...filteredCollections.map(c => 
                      `${c.collectionDate},"${c.concept}","${c.clientName || ''}","${c.paymentMethod}","${c.amount}","${c.paymentReference || ''}"`
                    )
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `cobros_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  link.click();
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const jsonContent = JSON.stringify(filteredCollections, null, 2);
                  const blob = new Blob([jsonContent], { type: 'application/json' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `cobros_${format(new Date(), 'yyyy-MM-dd')}.json`;
                  link.click();
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Imprimir Informe
              </Button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por concepto, cliente o referencia..."
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
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-[180px]">
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
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Cobros Registrados</CardTitle>
                  <Button onClick={() => setShowCollectionDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cobro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {collectionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-2 text-slate-600">Cargando cobros...</p>
                  </div>
                ) : filteredCollections.length === 0 ? (
                  <div className="text-center py-8">
                    <Euro className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No hay cobros registrados</p>
                  </div>
                ) : (
                  <CollectionsTable collections={filteredCollections} />
                )}
              </CardContent>
            </Card>

            <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
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
          </div>
        </div>
      </div>
    </div>
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