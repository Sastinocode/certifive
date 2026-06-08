import { cn } from "@/lib/utils";

type EnergyRating = "A" | "B" | "C" | "D" | "E" | "F" | "G";

// EU energy label colours — matches tailwind.config.ts `er.*` tokens.
const COLORS: Record<EnergyRating, string> = {
  A: "#166534",
  B: "#15803d",
  C: "#65a30d",
  D: "#ca8a04",
  E: "#ea580c",
  F: "#dc2626",
  G: "#b91c1c",
};

interface EnergyChipProps {
  rating: EnergyRating | string;
  className?: string;
}

export function EnergyChip({ rating, className }: EnergyChipProps) {
  const upper = (rating ?? "").toUpperCase() as EnergyRating;
  const bg    = COLORS[upper] ?? "#6b7280";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[26px] px-2 py-0.5 rounded-md",
        "text-xs font-bold text-white shadow-sm",
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {upper || "?"}
    </span>
  );
}
