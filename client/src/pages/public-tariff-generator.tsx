import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Home, MapPin, Calendar, CheckCircle, Euro, Camera, Clock, Ruler, Car, Building, Store } from "lucide-react";

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
  isActive: boolean;
}

interface BudgetFormData {
  propertyType: string;
  location: string;
  surface: number;
  constructionYear: number;
  distance: number;
  urgentService: boolean;
  photographyService: boolean;
  additionalMeasurements: boolean;
}

export default function PublicTariffGenerator() {
  const [formData, setFormData] = useState<BudgetFormData>({
    propertyType: "",
    location: "",
    surface: 0,
    constructionYear: 2000,
    distance: 0,
    urgentService: false,
    photographyService: false,
    additionalMeasurements: false,
  });

  const [calculatedBudget, setCalculatedBudget] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedRate, setSelectedRate] = useState<PricingRate | null>(null);

  // Fetch public pricing rates
  const { data: pricingRates = [], isLoading } = useQuery<PricingRate[]>({
    queryKey: ["/api/pricing-rates/public"],
  });

  // Property type mapping
  const propertyTypeMapping = {
    "vivienda": "Vivienda Residencial",
    "local_comercial": "Local Comercial", 
    "duplex": "Dúplex",
    "chalet": "Chalet/Casa Unifamiliar",
    "edificio_completo": "Edificio Completo"
  };

  const locationMapping = {
    "zona_urbana": "Zona Urbana",
    "zona_rural": "Zona Rural"
  };

  const getPropertyIcon = (propertyType: string) => {
    switch (propertyType) {
      case "vivienda": return Home;
      case "local_comercial": return Store;
      case "duplex": return Building;
      case "chalet": return Building;
      case "edificio_completo": return Building;
      default: return Home;
    }
  };

  // Get available property types and locations from pricing rates
  const availablePropertyTypes = [...new Set(pricingRates.map(rate => rate.propertyType))];
  const availableLocations = [...new Set(pricingRates.map(rate => rate.location))];

  // Get available services for selected rate
  const getAvailableServices = () => {
    if (!selectedRate) return { urgent: false, photography: false, measurements: false };
    
    return {
      urgent: selectedRate.urgentServiceAvailable,
      photography: selectedRate.photographyServiceAvailable,
      measurements: selectedRate.additionalMeasurementsAvailable
    };
  };

  const calculateBudget = () => {
    if (!formData.propertyType || !formData.location || !formData.surface) {
      return;
    }

    // Find matching pricing rate
    const matchingRate = pricingRates.find(
      rate => rate.propertyType === formData.propertyType && 
              rate.location === formData.location &&
              rate.isActive
    );

    if (!matchingRate) {
      setCalculatedBudget(null);
      setSelectedRate(null);
      return;
    }

    setSelectedRate(matchingRate);

    // Calculate base price
    let totalPrice = parseFloat(matchingRate.basePrice) + (parseFloat(matchingRate.pricePerM2) * formData.surface);

    // Apply rural surcharge if needed
    if (formData.location === "zona_rural") {
      const ruralSurcharge = parseFloat(matchingRate.ruralSurchargePercentage) / 100;
      totalPrice = totalPrice * (1 + ruralSurcharge);
    }

    // Add displacement cost
    if (formData.distance > 0 && matchingRate.includeDisplacement) {
      totalPrice += formData.distance * parseFloat(matchingRate.displacementCostPerKm);
    }

    // Add optional services
    if (formData.urgentService && matchingRate.urgentServiceAvailable) {
      totalPrice += parseFloat(matchingRate.urgentServicePrice);
    }
    if (formData.photographyService && matchingRate.photographyServiceAvailable) {
      totalPrice += parseFloat(matchingRate.photographyServicePrice);
    }
    if (formData.additionalMeasurements && matchingRate.additionalMeasurementsAvailable) {
      totalPrice += parseFloat(matchingRate.additionalMeasurementsPrice);
    }

    setCalculatedBudget(totalPrice);
    setShowResult(true);
  };

  useEffect(() => {
    if (formData.propertyType && formData.location) {
      const rate = pricingRates.find(
        rate => rate.propertyType === formData.propertyType && 
                rate.location === formData.location &&
                rate.isActive
      );
      setSelectedRate(rate || null);
      
      // Reset optional services if they're not available
      if (rate) {
        const availableServices = {
          urgent: rate.urgentServiceAvailable,
          photography: rate.photographyServiceAvailable,
          measurements: rate.additionalMeasurementsAvailable
        };
        
        setFormData(prev => ({
          ...prev,
          urgentService: prev.urgentService && availableServices.urgent,
          photographyService: prev.photographyService && availableServices.photography,
          additionalMeasurements: prev.additionalMeasurements && availableServices.measurements
        }));
      }
    }
  }, [formData.propertyType, formData.location, pricingRates]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const availableServices = getAvailableServices();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Generador de Presupuestos
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Calcula el precio de tu certificación energética de forma inmediata
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-2">
          {/* Form Section */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Datos de la Propiedad
              </CardTitle>
              <CardDescription>
                Completa los datos para calcular tu presupuesto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Type */}
              <div>
                <Label htmlFor="propertyType">Tipo de Propiedad</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePropertyTypes.map((type) => {
                      const Icon = getPropertyIcon(type);
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {propertyTypeMapping[type as keyof typeof propertyTypeMapping]}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {locationMapping[location as keyof typeof locationMapping]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Surface */}
              <div>
                <Label htmlFor="surface">Superficie (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  min="1"
                  value={formData.surface || ""}
                  onChange={(e) => setFormData({ ...formData, surface: parseInt(e.target.value) || 0 })}
                  placeholder="Ej: 85"
                />
              </div>

              {/* Construction Year */}
              <div>
                <Label htmlFor="constructionYear">Año de Construcción</Label>
                <Input
                  id="constructionYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.constructionYear}
                  onChange={(e) => setFormData({ ...formData, constructionYear: parseInt(e.target.value) })}
                />
              </div>

              {/* Distance */}
              {selectedRate?.includeDisplacement && (
                <div>
                  <Label htmlFor="distance">Distancia de Desplazamiento (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.distance || ""}
                    onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                    placeholder="Ej: 15.5"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Coste: {selectedRate ? parseFloat(selectedRate.displacementCostPerKm).toFixed(2) : 0}€/km
                  </p>
                </div>
              )}

              {/* Optional Services */}
              <div className="space-y-4">
                <Label>Servicios Opcionales</Label>
                
                {/* Urgent Service */}
                {availableServices.urgent && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="urgentService"
                      checked={formData.urgentService}
                      onCheckedChange={(checked) => setFormData({ ...formData, urgentService: checked as boolean })}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <Label htmlFor="urgentService" className="cursor-pointer">
                          Servicio Urgente
                        </Label>
                      </div>
                      <p className="text-sm text-gray-500">
                        +{selectedRate ? parseFloat(selectedRate.urgentServicePrice).toFixed(0) : 0}€
                      </p>
                    </div>
                  </div>
                )}

                {/* Photography Service */}
                {availableServices.photography && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="photographyService"
                      checked={formData.photographyService}
                      onCheckedChange={(checked) => setFormData({ ...formData, photographyService: checked as boolean })}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <Label htmlFor="photographyService" className="cursor-pointer">
                          Diseño Fotográfico
                        </Label>
                      </div>
                      <p className="text-sm text-gray-500">
                        +{selectedRate ? parseFloat(selectedRate.photographyServicePrice).toFixed(0) : 0}€
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Measurements */}
                {availableServices.measurements && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="additionalMeasurements"
                      checked={formData.additionalMeasurements}
                      onCheckedChange={(checked) => setFormData({ ...formData, additionalMeasurements: checked as boolean })}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        <Label htmlFor="additionalMeasurements" className="cursor-pointer">
                          Mediciones Adicionales
                        </Label>
                      </div>
                      <p className="text-sm text-gray-500">
                        +{selectedRate ? parseFloat(selectedRate.additionalMeasurementsPrice).toFixed(0) : 0}€
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={calculateBudget} 
                className="w-full"
                disabled={!formData.propertyType || !formData.location || !formData.surface}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Presupuesto
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showResult ? (
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Completa el formulario para ver tu presupuesto
                  </p>
                </div>
              ) : calculatedBudget === null ? (
                <div className="text-center py-12">
                  <p className="text-red-500 font-medium">
                    No hay tarifas disponibles para esta combinación
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Por favor, contacta directamente para obtener un presupuesto personalizado
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Total Price */}
                  <div className="text-center p-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg">
                    <div className="text-4xl font-bold text-green-700 dark:text-green-300 mb-2">
                      {calculatedBudget.toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Precio total estimado
                    </div>
                  </div>

                  {/* Breakdown */}
                  {selectedRate && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Desglose del presupuesto:</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Precio base:</span>
                          <span>{parseFloat(selectedRate.basePrice).toFixed(2)}€</span>
                        </div>
                        
                        {formData.surface > 0 && parseFloat(selectedRate.pricePerM2) > 0 && (
                          <div className="flex justify-between">
                            <span>Por m² ({formData.surface}m² × {parseFloat(selectedRate.pricePerM2).toFixed(2)}€):</span>
                            <span>{(formData.surface * parseFloat(selectedRate.pricePerM2)).toFixed(2)}€</span>
                          </div>
                        )}

                        {formData.location === "zona_rural" && (
                          <div className="flex justify-between">
                            <span>Recargo zona rural ({parseFloat(selectedRate.ruralSurchargePercentage)}%):</span>
                            <span>Incluido</span>
                          </div>
                        )}

                        {formData.distance > 0 && selectedRate.includeDisplacement && (
                          <div className="flex justify-between">
                            <span>Desplazamiento ({formData.distance}km):</span>
                            <span>{(formData.distance * parseFloat(selectedRate.displacementCostPerKm)).toFixed(2)}€</span>
                          </div>
                        )}

                        {formData.urgentService && selectedRate.urgentServiceAvailable && (
                          <div className="flex justify-between">
                            <span>Servicio urgente:</span>
                            <span>+{parseFloat(selectedRate.urgentServicePrice).toFixed(2)}€</span>
                          </div>
                        )}

                        {formData.photographyService && selectedRate.photographyServiceAvailable && (
                          <div className="flex justify-between">
                            <span>Diseño fotográfico:</span>
                            <span>+{parseFloat(selectedRate.photographyServicePrice).toFixed(2)}€</span>
                          </div>
                        )}

                        {formData.additionalMeasurements && selectedRate.additionalMeasurementsAvailable && (
                          <div className="flex justify-between">
                            <span>Mediciones adicionales:</span>
                            <span>+{parseFloat(selectedRate.additionalMeasurementsPrice).toFixed(2)}€</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Anticipo ({selectedRate.advancePercentage}%):</span>
                          <span className="font-bold text-green-600">
                            {(calculatedBudget * selectedRate.advancePercentage / 100).toFixed(2)}€
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-gray-500">Plazo de entrega:</span>
                          <span className="text-sm">{selectedRate.deliveryDays} días</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Presupuesto válido por 30 días
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Contacta para confirmar tu certificación energética
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}