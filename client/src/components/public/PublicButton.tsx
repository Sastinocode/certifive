import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

const primaryBase = [
  "h-[52px] px-7 border-0 rounded-full bg-pub-primary text-white font-bold text-[15px] cursor-pointer",
  "transition-all duration-150 shadow-[0_1px_3px_hsl(142_69%_36%/0.3)]",
  "hover:bg-pub-primary-dark hover:-translate-y-px hover:shadow-[0_6px_14px_hsl(142_69%_36%/0.35)]",
  "inline-flex items-center justify-center gap-2 no-underline",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
].join(" ");

const ghostBase = [
  "h-[52px] px-6 border-[1.5px] border-pub-border rounded-full bg-white text-pub-ink font-semibold text-[15px] cursor-pointer",
  "transition-all duration-150",
  "hover:border-[#cdd1d8] hover:bg-pub-bg",
  "inline-flex items-center justify-center gap-2 no-underline",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

// ── Primary button ────────────────────────────────────────────────────────

interface BtnPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function BtnPrimary({ children, size, href, className = "", ...props }: BtnPrimaryProps) {
  const sizeClass = size === "sm" ? "h-[42px] text-sm px-5" : size === "lg" ? "h-[56px] text-base px-9" : "";
  if (href) {
    return (
      <a href={href} className={`${primaryBase} ${sizeClass} ${className}`}>
        {children}
      </a>
    );
  }
  return (
    <button className={`${primaryBase} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── Ghost button ──────────────────────────────────────────────────────────

interface BtnGhostProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
}

export function BtnGhost({ children, href, className = "", ...props }: BtnGhostProps) {
  if (href) {
    return (
      <a href={href} className={`${ghostBase} ${className}`}>
        {children}
      </a>
    );
  }
  return (
    <button className={`${ghostBase} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── Arrow icon (reusable) ─────────────────────────────────────────────────

export function ArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

export function ArrowLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}
