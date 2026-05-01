import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, ArrowRight, Save, Home } from "lucide-react";
import GeneralDataForm from "@/components/certification/general-data-form";
import HousingDetailsForm from "@/components/certification/housing-details-form";
import InstallationsForm from "@/components/certification/installations-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CertificationData {
  dni: string;
  fullName: string;
  cadastralRef: string;
  phone: string;
  email: string;
  habitableFloors: number;
  rooms: number;
  facadeOrientation: string;
  windowDetails: string;
  roofType: string;
  airConditioningSystem: string;
  heatingSystem: string;
  waterHeatingType: string;
  waterHeatingCapacity?: number;
  photos: string[];
  observations?: string;
}

const steps = [
  { id: 1, title: "Datos Generales", component: "general" },
  { id: 2, title: "Detalles de Vivienda", component: "housing" },
  { id: 3, title: "Instalaciones", component: "installations" }
];

export default function CertificationWizard() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CertificationData>>({});

  const createCertificationMutation = useMutation({
    mutationFn: async (data: CertificationData) => {
      return apiRequest("POST", "/api/certifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Certificación creada",
        description: "La certificación se ha creado exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      navigate("/certificados");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear la certificación: " + error.message,
        variant: "destructive"
      });
    }
  });

  const updateFormData = (stepData: Partial<CertificationData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const requiredFields = ['dni', 'fullName', 'cadastralRef', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof CertificationData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    createCertificationMutation.mutate(formData as CertificationData);
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <Button
          variant="outline"
          onClick={() => navigate("/certificados")}
          className="mb-4"
        >
          <Home className="w-4 h-4 mr-2" />
          Volver a Certificados
        </Button>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {id ? "Editar Certificación" : "Nueva Certificación Energética"}
          </h1>
          <p className="text-gray-600">
            Complete los datos siguiendo el formulario oficial CEE
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep > step.id ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 
                      currentStep === step.id ? 'bg-blue-600 text-white' : 
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={`ml-2 text-sm ${currentStep === step.id ? 'font-medium' : ''}`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${currentStep > step.id ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <GeneralDataForm 
                data={formData} 
                onDataChange={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <HousingDetailsForm 
                data={formData} 
                onDataChange={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <InstallationsForm 
                data={formData} 
                onDataChange={updateFormData}
              />
            )}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/certificados")}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Borrador
                </Button>
                
                {currentStep === steps.length ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={createCertificationMutation.isPending}
                  >
                    {createCertificationMutation.isPending ? "Creando..." : "Crear Certificación"}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}