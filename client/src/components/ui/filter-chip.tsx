import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  /** Optional item count shown as a small badge. */
  count?: number;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export function FilterChip({
  label,
  count,
  active,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "text-sm font-medium transition-colors duration-100 select-none",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground hover:bg-muted",
        className,
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "inline-flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
