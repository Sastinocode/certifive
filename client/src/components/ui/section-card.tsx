import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  /** Optional subtitle shown below the title. */
  description?: string;
  /** Icon element rendered inside the primary-tinted square. */
  icon: ReactNode;
  children: ReactNode;
  /** Optional slot rendered to the right of the title. */
  action?: ReactNode;
  className?: string;
  /** Padding variant for the body — defaults to "default" (px-6 pb-6). */
  bodyPadding?: "default" | "none";
}

export function SectionCard({
  title,
  description,
  icon,
  children,
  action,
  className,
  bodyPadding = "default",
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary [&>svg]:stroke-[2.2]">{icon}</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action !== undefined && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </div>

      {/* Body */}
      <div className={cn(bodyPadding === "default" && "px-6 pb-6")}>
        {children}
      </div>
    </div>
  );
}
