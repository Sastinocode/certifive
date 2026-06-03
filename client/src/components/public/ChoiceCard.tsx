import { ReactNode } from "react";

// ── Full choice card (horizontal or vertical) ──────────────────────────────

interface ChoiceCardProps {
  selected?: boolean;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  vertical?: boolean; // use vertical layout for narrow 3-col grids
  className?: string;
}

export function ChoiceCard({ selected, onClick, icon, title, subtitle, vertical, className = "" }: ChoiceCardProps) {
  const base = "border-[1.5px] bg-white rounded-[14px] cursor-pointer transition-all duration-[120ms]";
  const stateDefault = "border-pub-border hover:border-[#cdd1d8] hover:bg-pub-bg";
  const stateSelected = "border-pub-primary bg-pub-primary-soft shadow-[0_0_0_3px_hsl(142_69%_36%/0.1)]";

  if (vertical) {
    return (
      <label
        onClick={onClick}
        className={`${base} ${selected ? stateSelected : stateDefault} relative flex flex-col items-start gap-2.5 p-4 pb-[14px] text-left ${className}`}
      >
        {/* Radio dot top-right */}
        <span className={[
          "absolute top-[13px] right-[13px] w-[18px] h-[18px] rounded-full border-2 bg-white transition-all duration-150",
          selected ? "border-pub-primary bg-[radial-gradient(circle,hsl(142_69%_36%)_0%_40%,white_45%_100%)]" : "border-[#cdd1d8]",
        ].join(" ")} />
        {/* Icon */}
        <span className={[
          "w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all",
          selected ? "bg-[hsl(142_60%_90%)] text-pub-primary-dark" : "bg-[#f1f3f5] text-pub-muted",
        ].join(" ")}>
          {icon}
        </span>
        {/* Text */}
        <div className="w-full min-w-0 pr-6">
          <p className="text-sm font-semibold text-pub-ink">{title}</p>
          {subtitle && <p className="text-[11px] text-pub-muted">{subtitle}</p>}
        </div>
      </label>
    );
  }

  return (
    <label
      onClick={onClick}
      className={`${base} ${selected ? stateSelected : stateDefault} flex items-center gap-3 p-4 ${className}`}
    >
      <span className={[
        "w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all",
        selected ? "bg-[hsl(142_60%_90%)] text-pub-primary-dark" : "bg-[#f1f3f5] text-pub-muted",
      ].join(" ")}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-pub-ink">{title}</p>
        {subtitle && <p className="text-[11px] text-pub-muted">{subtitle}</p>}
      </div>
      <span className={[
        "w-[18px] h-[18px] rounded-full border-2 bg-white flex-shrink-0 ml-auto transition-all duration-150",
        selected ? "border-pub-primary bg-[radial-gradient(circle,hsl(142_69%_36%)_0%_40%,white_45%_100%)]" : "border-[#cdd1d8]",
      ].join(" ")} />
    </label>
  );
}

// ── Compact choice chip (no icon) ──────────────────────────────────────────

interface ChoiceSmallProps {
  selected?: boolean;
  onClick?: () => void;
  label: string;
  className?: string;
}

export function ChoiceSmall({ selected, onClick, label, className = "" }: ChoiceSmallProps) {
  return (
    <label
      onClick={onClick}
      className={[
        "flex items-center gap-2.5 px-[14px] py-3 border-[1.5px] bg-white rounded-[12px] cursor-pointer text-sm font-semibold text-pub-ink transition-all duration-[120ms]",
        selected
          ? "border-pub-primary bg-pub-primary-soft shadow-[0_0_0_3px_hsl(142_69%_36%/0.1)]"
          : "border-pub-border hover:border-[#cdd1d8] hover:bg-pub-bg",
        className,
      ].join(" ")}
    >
      <span className={[
        "w-4 h-4 rounded-full border-2 bg-white flex-shrink-0 transition-all duration-150",
        selected ? "border-pub-primary bg-[radial-gradient(circle,hsl(142_69%_36%)_0%_40%,white_45%_100%)]" : "border-[#cdd1d8]",
      ].join(" ")} />
      {label}
    </label>
  );
}
