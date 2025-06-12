import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import StepIndicators from "@/components/certification/step-indicators";
import GeneralDataForm from "@/components/certification/general-data-form";
import HousingDetailsForm from "@/components/certification/housing-details-form";
import InstallationsForm from "@/components/certification/installations-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export default function CertificationWizard() {
  const { id } = useParams<{ id?: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing certification if editing
  const { data: certification } = useQuery({
    queryKey: ["/api/certifications", id],
    enabled: !!id,
  });

  useEffect(() => {
    if (certification) {
      setFormData(certification);
    }
  }, [certification]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/certifications", data);
      return response.json();
    },
    onSuccess: (newCertification) => {
      toast({
        title: "Certificación creada",
        description: "Los datos generales han sido guardados correctamente.",
      });
      // Update URL to editing mode
      window.history.replaceState({}, "", `/certificacion/${newCertification.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la certificación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/certifications/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cambios guardados",
        description: "La certificación ha sido actualizada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/certifications/${id}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificación completada",
        description: "El certificado energético ha sido generado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo completar la certificación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    const currentStepData = getCurrentStepData();
    
    if (!validateCurrentStep(currentStepData)) {
      return;
    }

    const updatedFormData = { ...formData, ...currentStepData };
    setFormData(updatedFormData);

    // Save data to server
    try {
      if (id) {
        await updateMutation.mutateAsync(currentStepData);
      } else if (currentStep === 1) {
        const newCertification = await createMutation.mutateAsync(updatedFormData);
        setFormData(newCertification);
      }

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const currentStepData = getCurrentStepData();
    
    if (!validateCurrentStep(currentStepData)) {
      return;
    }

    const updatedFormData = { ...formData, ...currentStepData };
    
    try {
      // First update with final data
      if (id) {
        await updateMutation.mutateAsync(currentStepData);
        // Then complete the certification
        await completeMutation.mutateAsync();
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const getCurrentStepData = () => {
    const stepForms = document.querySelectorAll('.step-form');
    const currentForm = stepForms[currentStep - 1] as HTMLFormElement;
    
    if (!currentForm) return {};

    const formData = new FormData(currentForm);
    const data: any = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  };

  const validateCurrentStep = (data: any) => {
    switch (currentStep) {
      case 1:
        return data.dni && data.fullName && data.cadastralRef;
      case 2:
        return data.facadeOrientation && data.roofType;
      case 3:
        return data.hvacSystem && data.heatingSystem && data.waterHeatingType;
      default:
        return true;
    }
  };

  const updateFormData = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="certifications" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Nueva Certificación</h1>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Progress Steps */}
          <StepIndicators currentStep={currentStep} />

          {/* Step Content */}
          <div className="max-w-3xl mx-auto">
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
                certificationId={id}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={updateMutation.isPending || createMutation.isPending}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              <div className="ml-auto">
                {currentStep < 3 ? (
                  <Button 
                    onClick={handleNext}
                    disabled={updateMutation.isPending || createMutation.isPending}
                  >
                    {updateMutation.isPending || createMutation.isPending ? "Guardando..." : "Siguiente"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleComplete}
                    disabled={completeMutation.isPending || updateMutation.isPending}
                    className="bg-success hover:bg-success/90"
                  >
                    {completeMutation.isPending ? "Completando..." : "Completar Certificación"}
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
