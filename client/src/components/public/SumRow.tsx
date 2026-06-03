import { ReactNode } from "react";

interface SumRowProps {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
  green?: boolean;
}

export function SumRow({ label, value, muted, green }: SumRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-[14px] border-b border-pub-border-soft last:border-0">
      <span className="text-[13.5px] text-pub-muted">{label}</span>
      <span className={`text-[13.5px] font-semibold text-right ${green ? "text-pub-primary" : "text-pub-ink"} ${muted ? "text-pub-muted" : ""}`}>
        {value}
      </span>
    </div>
  );
}

interface LineItemProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  className?: string;
}

export function LineItem({ icon, title, subtitle, badge, className = "" }: LineItemProps) {
  return (
    <div className={`flex items-start justify-between gap-4 py-4 border-b border-pub-border-soft last:border-0 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-pub-primary-soft text-pub-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            {icon}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-pub-ink">{title}</p>
          {subtitle && <p className="text-[12px] text-pub-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
    </div>
  );
}
