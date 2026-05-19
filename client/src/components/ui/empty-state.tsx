import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "outline" | "ghost";
}

interface EmptyStateProps {
  /** Lucide icon or custom JSX rendered at the top */
  icon: ReactNode;
  /** Main headline */
  title: string;
  /** Supporting description below the title */
  description?: string;
  /** Primary CTA button */
  action?: EmptyStateAction;
  /** Secondary / ghost action */
  secondaryAction?: EmptyStateAction;
  /**
   * compact: smaller padding, smaller icon — for panels embedded inside pages.
   * full: large centred layout for full-page or tab-level states.
   */
  size?: "compact" | "full";
  className?: string;
}

/**
 * EmptyState — reusable professional empty/zero-data placeholder.
 *
 * Usage:
 *   <EmptyState
 *     icon={<FileText className="w-10 h-10" />}
 *     title="Sin certificaciones"
 *     description="Crea tu primera certificación energética para empezar."
 *     action={{ label: "Crear certificación", onClick: handleNew, icon: <Plus className="w-4 h-4" /> }}
 *   />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "full",
  className,
}: EmptyStateProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "py-10 px-4" : "py-16 px-6",
        className,
      )}
    >
      {/* Icon bubble */}
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-5",
          "bg-muted/60 text-muted-foreground",
          isCompact ? "w-14 h-14" : "w-20 h-20",
        )}
      >
        <span
          className={cn(
            "[&>svg]:w-full [&>svg]:h-full p-3.5",
            isCompact ? "p-3" : "p-4",
          )}
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <h3
        className={cn(
          "font-semibold text-foreground mb-1.5",
          isCompact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-xs leading-relaxed",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div
          className={cn(
            "flex items-center gap-3 flex-wrap justify-center",
            isCompact ? "mt-4" : "mt-6",
          )}
        >
          {action && (
            <Button
              size={isCompact ? "sm" : "default"}
              variant={action.variant ?? "default"}
              onClick={action.onClick}
              className="gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size={isCompact ? "sm" : "default"}
              variant={secondaryAction.variant ?? "ghost"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
