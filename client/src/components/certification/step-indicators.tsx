interface StepIndicatorsProps {
  currentStep: number;
}

export default function StepIndicators({ currentStep }: StepIndicatorsProps) {
  const steps = [
    { number: 1, title: "Datos Generales" },
    { number: 2, title: "Detalles Vivienda" },
    { number: 3, title: "Instalaciones" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={`step-indicator ${
                    step.number < currentStep
                      ? "completed"
                      : step.number === currentStep
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step.number === currentStep
                      ? "text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`step-connector w-16 ml-4 ${
                    step.number < currentStep ? "completed" : "inactive"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
