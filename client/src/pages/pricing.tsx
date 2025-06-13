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
  Camera,
  Ruler,
  MapPin,
  Car,
  Settings2,
  CheckSquare,
  Copy,
  Share
} from "lucide-react";

interface PricingRate {
  id: number;
  propertyType: string;
  location: string;
  basePrice: string;
  pricePerM2: string;
  ruralSurchargePercentage: string;
  displacementCostPerKm: string;
  includeDisplacement: boolean;
  urgentServicePrice: string;
  urgentServiceAvailable: boolean;
  photographyServicePrice: string;
  photographyServiceAvailable: boolean;
  additionalMeasurementsPrice: string;
  additionalMeasurementsAvailable: boolean;
  advancePercentage: number;
  deliveryDays: number;
  description: string | null;
  isActive: boolean;
}

const propertyTypes = [
  { value: "vivienda", label: "Vivienda Residencial", icon: Home },
  { value: "local_comercial", label: "Local Comercial", icon: Store },
  { value: "duplex", label: "Dúplex", icon: Building },
  { value: "chalet", label: "Chalet/Casa Unifamiliar", icon: Building },
  { value: "edificio_completo", label: "Edificio Completo", icon: Building },
];

const locations = [
  { value: "zona_urbana", label: "Zona Urbana" },
  { value: "zona_rural", label: "Zona Rural" },
];

export default function Pricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: pricingRates, isLoading } = useQuery<PricingRate[]>({
    queryKey: ["/api/pricing-rates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<PricingRate, "id">) => {
      return apiRequest("POST", "/api/pricing-rates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rates"] });
      setShowAddForm(false);
      toast({
        title: "Tarifa creada",
        description: "La nueva configuración de tarifas se ha guardado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la tarifa",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PricingRate> }) => {
      return apiRequest("PATCH", `/api/pricing-rates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rates"] });
      setIsEditing(null);
      toast({
        title: "Tarifa actualizada",
        description: "La configuración se ha actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarifa",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/pricing-rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rates"] });
      toast({
        title: "Tarifa eliminada",
        description: "La configuración se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarifa",
        variant: "destructive",
      });
    },
  });

  const generatePublicLink = () => {
    const baseUrl = window.location.origin;
    const publicLink = `${baseUrl}/generador-presupuesto`;
    navigator.clipboard.writeText(publicLink);
    toast({
      title: "Enlace copiado",
      description: "El enlace público del generador de presupuestos se ha copiado al portapapeles",
    });
  };

  const PricingForm = ({ 
    initialData, 
    onSubmit, 
    onCancel, 
    isLoading 
  }: {
    initialData?: Partial<PricingRate>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading: boolean;
  }) => {
    const [formData, setFormData] = useState({
      propertyType: initialData?.propertyType || "",
      location: initialData?.location || "",
      basePrice: initialData?.basePrice || "",
      pricePerM2: initialData?.pricePerM2 || "0",
      ruralSurchargePercentage: initialData?.ruralSurchargePercentage || "15",
      displacementCostPerKm: initialData?.displacementCostPerKm || "0.45",
      includeDisplacement: initialData?.includeDisplacement ?? true,
      urgentServicePrice: initialData?.urgentServicePrice || "0",
      urgentServiceAvailable: initialData?.urgentServiceAvailable ?? true,
      photographyServicePrice: initialData?.photographyServicePrice || "0",
      photographyServiceAvailable: initialData?.photographyServiceAvailable ?? true,
      additionalMeasurementsPrice: initialData?.additionalMeasurementsPrice || "0",
      additionalMeasurementsAvailable: initialData?.additionalMeasurementsAvailable ?? true,
      advancePercentage: initialData?.advancePercentage || 50,
      deliveryDays: initialData?.deliveryDays || 7,
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configuración Básica
            </h3>
            
            <div>
              <Label htmlFor="propertyType">Tipo de Propiedad</Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="basePrice">Precio Base (€)</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="pricePerM2">Precio por m² (€)</Label>
              <Input
                id="pricePerM2"
                type="number"
                step="0.01"
                value={formData.pricePerM2}
                onChange={(e) => setFormData({ ...formData, pricePerM2: e.target.value })}
              />
            </div>
          </div>

          {/* Location & Displacement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación y Desplazamiento
            </h3>

            <div>
              <Label htmlFor="ruralSurchargePercentage">Recargo Zona Rural (%)</Label>
              <Input
                id="ruralSurchargePercentage"
                type="number"
                step="0.01"
                value={formData.ruralSurchargePercentage}
                onChange={(e) => setFormData({ ...formData, ruralSurchargePercentage: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includeDisplacement"
                checked={formData.includeDisplacement}
                onCheckedChange={(checked) => setFormData({ ...formData, includeDisplacement: checked })}
              />
              <Label htmlFor="includeDisplacement">Incluir costes de desplazamiento</Label>
            </div>

            <div>
              <Label htmlFor="displacementCostPerKm">Coste por Km (€)</Label>
              <Input
                id="displacementCostPerKm"
                type="number"
                step="0.01"
                value={formData.displacementCostPerKm}
                onChange={(e) => setFormData({ ...formData, displacementCostPerKm: e.target.value })}
                disabled={!formData.includeDisplacement}
              />
            </div>
          </div>
        </div>

        {/* Optional Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Servicios Opcionales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Urgent Service */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Servicio Urgente</span>
                </div>
                <Switch
                  checked={formData.urgentServiceAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, urgentServiceAvailable: checked })}
                />
              </div>
              <div>
                <Label htmlFor="urgentServicePrice">Precio (€)</Label>
                <Input
                  id="urgentServicePrice"
                  type="number"
                  step="0.01"
                  value={formData.urgentServicePrice}
                  onChange={(e) => setFormData({ ...formData, urgentServicePrice: e.target.value })}
                  disabled={!formData.urgentServiceAvailable}
                />
              </div>
            </div>

            {/* Photography Service */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="font-medium">Diseño Fotográfico</span>
                </div>
                <Switch
                  checked={formData.photographyServiceAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, photographyServiceAvailable: checked })}
                />
              </div>
              <div>
                <Label htmlFor="photographyServicePrice">Precio (€)</Label>
                <Input
                  id="photographyServicePrice"
                  type="number"
                  step="0.01"
                  value={formData.photographyServicePrice}
                  onChange={(e) => setFormData({ ...formData, photographyServicePrice: e.target.value })}
                  disabled={!formData.photographyServiceAvailable}
                />
              </div>
            </div>

            {/* Additional Measurements */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  <span className="font-medium">Mediciones Adicionales</span>
                </div>
                <Switch
                  checked={formData.additionalMeasurementsAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, additionalMeasurementsAvailable: checked })}
                />
              </div>
              <div>
                <Label htmlFor="additionalMeasurementsPrice">Precio (€)</Label>
                <Input
                  id="additionalMeasurementsPrice"
                  type="number"
                  step="0.01"
                  value={formData.additionalMeasurementsPrice}
                  onChange={(e) => setFormData({ ...formData, additionalMeasurementsPrice: e.target.value })}
                  disabled={!formData.additionalMeasurementsAvailable}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="advancePercentage">Porcentaje de Anticipo (%)</Label>
            <Input
              id="advancePercentage"
              type="number"
              min="0"
              max="100"
              value={formData.advancePercentage}
              onChange={(e) => setFormData({ ...formData, advancePercentage: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="deliveryDays">Días de Entrega</Label>
            <Input
              id="deliveryDays"
              type="number"
              min="1"
              value={formData.deliveryDays}
              onChange={(e) => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descripción (Opcional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción adicional de esta configuración de tarifa..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Tarifa activa</Label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear Tarifa"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
        <Sidebar selectedTab="pricing" onTabChange={() => {}} />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
      <Sidebar selectedTab="pricing" onTabChange={() => {}} />
      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configuración de Tarifas
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Configura precios base y servicios opcionales para el generador público de presupuestos
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={generatePublicLink} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar Enlace Público
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Tarifa
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Nueva Configuración de Tarifa</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setShowAddForm(false)}
                isLoading={createMutation.isPending}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {pricingRates?.map((rate) => (
            <Card key={rate.id} className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {propertyTypes.find(type => type.value === rate.propertyType)?.icon && (
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                        {(() => {
                          const IconComponent = propertyTypes.find(type => type.value === rate.propertyType)?.icon;
                          return IconComponent ? <IconComponent className="h-5 w-5 text-white" /> : null;
                        })()}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">
                        {propertyTypes.find(type => type.value === rate.propertyType)?.label}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {locations.find(loc => loc.value === rate.location)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rate.isActive ? "default" : "secondary"}>
                      {rate.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(rate.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(rate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing === rate.id ? (
                  <PricingForm
                    initialData={rate}
                    onSubmit={(data) => updateMutation.mutate({ id: rate.id, data })}
                    onCancel={() => setIsEditing(null)}
                    isLoading={updateMutation.isPending}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Pricing Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {parseFloat(rate.basePrice).toLocaleString()}€
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Precio Base</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {parseFloat(rate.pricePerM2).toLocaleString()}€
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Por m²</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {rate.advancePercentage}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Anticipo</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {rate.deliveryDays}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Días</div>
                      </div>
                    </div>

                    {/* Optional Services */}
                    <div>
                      <h4 className="font-semibold mb-3">Servicios Opcionales</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-3 rounded-lg border ${rate.urgentServiceAvailable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Servicio Urgente</span>
                          </div>
                          <div className="text-lg font-bold">
                            {rate.urgentServiceAvailable ? `${parseFloat(rate.urgentServicePrice).toLocaleString()}€` : 'No disponible'}
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${rate.photographyServiceAvailable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Camera className="h-4 w-4" />
                            <span className="font-medium">Diseño Fotográfico</span>
                          </div>
                          <div className="text-lg font-bold">
                            {rate.photographyServiceAvailable ? `${parseFloat(rate.photographyServicePrice).toLocaleString()}€` : 'No disponible'}
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${rate.additionalMeasurementsAvailable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Ruler className="h-4 w-4" />
                            <span className="font-medium">Mediciones Adicionales</span>
                          </div>
                          <div className="text-lg font-bold">
                            {rate.additionalMeasurementsAvailable ? `${parseFloat(rate.additionalMeasurementsPrice).toLocaleString()}€` : 'No disponible'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Displacement */}
                    {rate.includeDisplacement && (
                      <div>
                        <h4 className="font-semibold mb-2">Configuración de Desplazamiento</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <span>{parseFloat(rate.displacementCostPerKm).toFixed(2)}€ por km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            <span>{parseFloat(rate.ruralSurchargePercentage)}% recargo zona rural</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {rate.description && (
                      <div>
                        <h4 className="font-semibold mb-2">Descripción</h4>
                        <p className="text-gray-600 dark:text-gray-300">{rate.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(!pricingRates || pricingRates.length === 0) && !showAddForm && (
          <Card className="text-center py-12">
            <CardContent>
              <Euro className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay tarifas configuradas
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Comienza creando tu primera configuración de tarifa para el generador público de presupuestos
              </p>
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Crear Primera Tarifa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}