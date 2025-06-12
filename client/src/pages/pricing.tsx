import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Euro, 
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Store,
  Clock,
  Percent,
  Share2,
  Calculator,
  Copy
} from "lucide-react";

interface PricingRate {
  id: number;
  propertyType: string;
  basePrice: string;
  advancePercentage: number;
  deliveryDays: number;
  description: string | null;
  isActive: boolean;
}

const propertyTypes = [
  { value: "vivienda", label: "Vivienda Residencial", icon: Home },
  { value: "local_comercial", label: "Local Comercial", icon: Store },
  { value: "chalet", label: "Chalet/Casa Unifamiliar", icon: Building },
  { value: "edificio_completo", label: "Edificio Completo", icon: Building },
];

export default function Pricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyType: "",
    basePrice: "",
    advancePercentage: 50,
    deliveryDays: 7,
    description: "",
    isActive: true
  });

  const { data: pricingRates = [], isLoading } = useQuery({
    queryKey: ["/api/pricing-rates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/pricing-rates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tarifa creada",
        description: "La nueva tarifa ha sido añadida correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rates"] });
      setShowAddForm(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la tarifa. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/pricing-rates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tarifa actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rates"] });
      setIsEditing(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pricing-rates/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Tarifa eliminada",
        description: "La tarifa ha sido eliminada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rates"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarifa.",
        variant: "destructive",
      });
    },
  });

  const createQuoteLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quote-requests", {});
      return response.json();
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/presupuesto/${data.uniqueLink}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Enlace generado",
        description: "El enlace ha sido copiado al portapapeles.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el enlace.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      propertyType: "",
      basePrice: "",
      advancePercentage: 50,
      deliveryDays: 7,
      description: "",
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyType || !formData.basePrice) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      basePrice: parseFloat(formData.basePrice)
    };

    if (isEditing) {
      updateMutation.mutate({ id: isEditing, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (rate: PricingRate) => {
    setFormData({
      propertyType: rate.propertyType,
      basePrice: rate.basePrice,
      advancePercentage: rate.advancePercentage,
      deliveryDays: rate.deliveryDays,
      description: rate.description || "",
      isActive: rate.isActive
    });
    setIsEditing(rate.id);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setShowAddForm(false);
    resetForm();
  };

  const getPropertyTypeLabel = (type: string) => {
    return propertyTypes.find(pt => pt.value === type)?.label || type;
  };

  const getPropertyTypeIcon = (type: string) => {
    const PropertyIcon = propertyTypes.find(pt => pt.value === type)?.icon || Home;
    return <PropertyIcon className="w-4 h-4" />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="pricing" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Tarifas</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Tarifas</h2>
                <p className="text-gray-600">Configura tus precios por tipo de certificación</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => createQuoteLinkMutation.mutate()}
                  variant="outline"
                  disabled={createQuoteLinkMutation.isPending}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {createQuoteLinkMutation.isPending ? "Generando..." : "Generar Enlace"}
                </Button>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarifa
                </Button>
              </div>
            </div>
          </div>

          {/* Public Tariff Generator Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Generador Público de Presupuestos</h4>
                  <p className="text-sm text-gray-600">Comparte este enlace con tus clientes para que generen presupuestos automáticamente</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/create-sample-pricing");
                      toast({
                        title: "Datos de muestra creados",
                        description: "Se han añadido tarifas de ejemplo para probar el generador",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Error al crear datos de muestra",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Tarifas Demo
                </Button>
                <Button
                  onClick={() => {
                    const url = `${window.location.origin}/generador-tarifas`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Enlace copiado",
                      description: "El enlace del generador de tarifas se ha copiado al portapapeles",
                    });
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Enlace
                </Button>
              </div>
            </div>
            <div className="mt-4 bg-white/60 rounded-lg p-3 border">
              <code className="text-sm text-gray-700 break-all">
                {window.location.origin}/generador-tarifas
              </code>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {isEditing ? "Editar Tarifa" : "Nueva Tarifa"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="propertyType">Tipo de Propiedad *</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                <type.icon className="w-4 h-4 mr-2" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="basePrice">Precio Base (€) *</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="basePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.basePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                          className="pl-10"
                          placeholder="250.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="advancePercentage">Anticipo (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="advancePercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.advancePercentage}
                          onChange={(e) => setFormData(prev => ({ ...prev, advancePercentage: parseInt(e.target.value) || 0 }))}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="deliveryDays">Días de Entrega</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="deliveryDays"
                          type="number"
                          min="1"
                          value={formData.deliveryDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryDays: parseInt(e.target.value) || 1 }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción detallada del servicio incluido..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Tarifa activa</Label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Guardando..."
                        : isEditing
                        ? "Actualizar Tarifa"
                        : "Crear Tarifa"
                      }
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Pricing Rates List */}
          <Card>
            <CardHeader>
              <CardTitle>Tarifas Configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando tarifas...</p>
                </div>
              ) : pricingRates.length === 0 ? (
                <div className="text-center py-8">
                  <Euro className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No hay tarifas configuradas aún</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primera tarifa
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pricingRates.map((rate: PricingRate) => (
                    <Card key={rate.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            {getPropertyTypeIcon(rate.propertyType)}
                            <div className="ml-3">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {getPropertyTypeLabel(rate.propertyType)}
                              </h3>
                              <div className="flex items-center mt-1">
                                {rate.isActive ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Activa</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800 text-xs">Inactiva</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(rate)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(rate.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Precio Base</span>
                            <span className="text-lg font-bold text-gray-900">
                              {parseFloat(rate.basePrice).toFixed(2)}€
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Anticipo</span>
                            <span className="text-sm text-gray-900">
                              {rate.advancePercentage}% ({(parseFloat(rate.basePrice) * rate.advancePercentage / 100).toFixed(2)}€)
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Entrega</span>
                            <span className="text-sm text-gray-900">{rate.deliveryDays} días</span>
                          </div>

                          {rate.description && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-600">{rate.description}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}