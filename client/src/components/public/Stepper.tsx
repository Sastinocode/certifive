interface StepperProps {
  current: number; // 1-based
  steps?: string[];
}

const DEFAULT_STEPS = ["Solicitud", "Datos técnicos", "Presupuesto", "Pago"];

export function Stepper({ current, steps = DEFAULT_STEPS }: StepperProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5">
        <div className="flex items-center gap-0 w-full max-w-[560px] mx-auto">
          {steps.map((label, i) => {
            const n = i + 1;
            const done   = n < current;
            const active = n === current;
            return (
              <div key={n} className="flex items-center" style={{ flex: i < steps.length - 1 ? "1 1 auto" : "0 0 auto" }}>
                {/* Step bubble + label */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className={[
                    "w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-all border-[1.5px]",
                    done   ? "bg-pub-primary border-pub-primary text-white" : "",
                    active ? "bg-pub-primary-soft border-pub-primary text-pub-primary-dark shadow-[0_0_0_4px_hsl(142_69%_36%/0.1)]" : "",
                    !done && !active ? "bg-white border-pub-border text-[#8a939e]" : "",
                  ].join(" ")}>
                    {done ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : n}
                  </div>
                  <span className={[
                    "text-[12.5px] font-semibold whitespace-nowrap",
                    i > 0 ? "hidden sm:inline" : "",
                    done || active ? "text-pub-ink" : "text-[#8a939e]",
                  ].join(" ")}>
                    {label}
                  </span>
                </div>
                {/* Segment connector */}
                {i < steps.length - 1 && (
                  <div className={[
                    "flex-1 h-[2px] mx-2.5 rounded-full min-w-[14px]",
                    done ? "bg-pub-primary" : "bg-pub-border",
                  ].join(" ")} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
