import { ReactNode } from "react";

type PillVariant = "green" | "amber" | "slate" | "red";

interface PillProps {
  variant?: PillVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<PillVariant, string> = {
  green: "bg-pub-primary-soft text-[hsl(142_69%_28%)]",
  amber: "bg-[#fef3e2] text-[#9a6207]",
  slate: "bg-[#f1f3f5] text-pub-muted",
  red:   "bg-[#fef2f2] text-[#dc2626]",
};

export function Pill({ variant = "green", children, className = "" }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-full text-[11.5px] font-bold tracking-[0.02em] ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
