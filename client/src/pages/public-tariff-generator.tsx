import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Home, MapPin, Calendar, CheckCircle, Euro } from "lucide-react";

interface PricingRate {
  id: number;
  propertyType: string;
  location: string;
  basePrice: number;
  pricePerM2: number;
  urgentSurcharge: number;
  photographySurcharge: number;
  additionalMeasurementsSurcharge: number;
  isActive: boolean;
}

interface BudgetFormData {
  propertyType: string;
  location: string;
  surface: number;
  constructionYear: number;
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
    urgentService: false,
    photographyService: false,
    additionalMeasurements: false,
  });

  const [calculatedBudget, setCalculatedBudget] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Fetch public pricing rates
  const { data: pricingRates = [], isLoading } = useQuery<PricingRate[]>({
    queryKey: ["/api/pricing-rates/public"],
  });

  // Get unique property types and locations from pricing rates
  const propertyTypes = Array.from(new Set(pricingRates.map(rate => rate.propertyType)));
  const locations = Array.from(new Set(pricingRates.map(rate => rate.location)));

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
      return;
    }

    let totalPrice = matchingRate.basePrice + (matchingRate.pricePerM2 * formData.surface);

    // Add surcharges
    if (formData.urgentService) {
      totalPrice += matchingRate.urgentSurcharge;
    }
    if (formData.photographyService) {
      totalPrice += matchingRate.photographySurcharge;
    }
    if (formData.additionalMeasurements) {
      totalPrice += matchingRate.additionalMeasurementsSurcharge;
    }

    setCalculatedBudget(totalPrice);
    setShowResult(true);
  };

  const resetForm = () => {
    setFormData({
      propertyType: "",
      location: "",
      surface: 0,
      constructionYear: 2000,
      urgentService: false,
      photographyService: false,
      additionalMeasurements: false,
    });
    setCalculatedBudget(null);
    setShowResult(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calculadora de presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calculadora de Presupuesto</h1>
              <p className="text-gray-600">Complete los datos de la propiedad para recibir un presupuesto instantáneo para su certificado energético.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-green-600" />
                <span>Datos de la Propiedad</span>
              </CardTitle>
              <CardDescription>
                Ingrese la información sobre la propiedad que necesita certificar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Type and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Tipo de Inmueble</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Surface and Construction Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surface">Superficie (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    placeholder="80"
                    value={formData.surface || ""}
                    onChange={(e) => setFormData({ ...formData, surface: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constructionYear">Año de Construcción</Label>
                  <Input
                    id="constructionYear"
                    type="number"
                    placeholder="2000"
                    value={formData.constructionYear}
                    onChange={(e) => setFormData({ ...formData, constructionYear: parseInt(e.target.value) || 2000 })}
                  />
                </div>
              </div>

              {/* Additional Services */}
              <div className="space-y-4">
                <Label>Servicios Adicionales</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="urgent"
                    checked={formData.urgentService}
                    onCheckedChange={(checked) => setFormData({ ...formData, urgentService: checked as boolean })}
                  />
                  <Label htmlFor="urgent" className="text-sm font-normal">
                    Servicio urgente (entrega en 48h)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="photography"
                    checked={formData.photographyService}
                    onCheckedChange={(checked) => setFormData({ ...formData, photographyService: checked as boolean })}
                  />
                  <Label htmlFor="photography" className="text-sm font-normal">
                    Servicio de fotografía profesional
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="measurements"
                    checked={formData.additionalMeasurements}
                    onCheckedChange={(checked) => setFormData({ ...formData, additionalMeasurements: checked as boolean })}
                  />
                  <Label htmlFor="measurements" className="text-sm font-normal">
                    Mediciones de eficiencia adicionales
                  </Label>
                </div>
              </div>

              {/* Calculate Button */}
              <Button 
                onClick={calculateBudget}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!formData.propertyType || !formData.location || !formData.surface}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Presupuesto
              </Button>
            </CardContent>
          </Card>

          {/* Result Card */}
          <div className="space-y-6">
            {showResult && calculatedBudget && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span>Presupuesto Calculado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {calculatedBudget.toFixed(2)}€
                    </div>
                    <p className="text-gray-600 mb-4">
                      Precio estimado para su certificado energético
                    </p>
                    
                    {/* Breakdown */}
                    <div className="bg-white rounded-lg p-4 space-y-2 text-left">
                      <h4 className="font-semibold text-gray-800 mb-2">Desglose del presupuesto:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Tipo de propiedad:</span>
                          <span className="font-medium">{formData.propertyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ubicación:</span>
                          <span className="font-medium">{formData.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Superficie:</span>
                          <span className="font-medium">{formData.surface} m²</span>
                        </div>
                        {formData.urgentService && (
                          <div className="flex justify-between text-orange-600">
                            <span>Servicio urgente:</span>
                            <span className="font-medium">Incluido</span>
                          </div>
                        )}
                        {formData.photographyService && (
                          <div className="flex justify-between text-blue-600">
                            <span>Fotografía profesional:</span>
                            <span className="font-medium">Incluido</span>
                          </div>
                        )}
                        {formData.additionalMeasurements && (
                          <div className="flex justify-between text-purple-600">
                            <span>Mediciones adicionales:</span>
                            <span className="font-medium">Incluido</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <Button 
                        onClick={resetForm}
                        variant="outline"
                        className="flex-1"
                      >
                        Nueva Consulta
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => window.open('tel:+34-XXX-XXX-XXX', '_self')}
                      >
                        Solicitar Certificado
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué incluye el certificado energético?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Certificado oficial válido para venta o alquiler</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Informe detallado de eficiencia energética</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Recomendaciones de mejora</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Registro en organismo oficial</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Asesoramiento técnico personalizado</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}