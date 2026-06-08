import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Delta {
  value: string;
  positive: boolean;
}

interface KpiCardProps {
  /** Lucide icon element, rendered inside the colored square. */
  icon: ReactNode;
  /** Tailwind bg-* class for the icon container (e.g. "bg-primary", "bg-blue-500"). */
  iconBg: string;
  /** Short label shown as uppercase eyebrow. */
  label: string;
  /** Main metric value. */
  value: string | number;
  /** Optional secondary line below the value. */
  sub?: string;
  /** Optional trend badge. */
  delta?: Delta;
  className?: string;
}

export function KpiCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  delta,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6",
        "flex flex-col gap-4 hover:shadow-md transition-shadow",
        className,
      )}
    >
      {/* Icon row */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0",
            iconBg,
          )}
        >
          <span className="text-white [&>svg]:stroke-[2.2]">{icon}</span>
        </div>

        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5",
              delta.positive
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40",
            )}
          >
            {delta.positive ? (
              <TrendingUp size={11} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={11} strokeWidth={2.5} />
            )}
            {delta.value}
          </span>
        )}
      </div>

      {/* Text stack */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">
          {label}
        </p>
        <p className="text-[2.25rem] sm:text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
          {value}
        </p>
        {sub !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}
