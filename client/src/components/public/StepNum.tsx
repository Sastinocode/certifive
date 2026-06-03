interface StepNumProps {
  n: number;
}

export function StepNum({ n }: StepNumProps) {
  return (
    <span className="w-7 h-7 rounded-full bg-[hsl(142_60%_95%)] text-[hsl(142_60%_30%)] text-xs font-extrabold flex items-center justify-center flex-shrink-0">
      {n}
    </span>
  );
}
