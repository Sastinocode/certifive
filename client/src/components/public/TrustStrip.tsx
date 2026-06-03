import { ReactNode } from "react";

interface TrustItemProps {
  icon: ReactNode;
  label: string;
}

export function TrustItem({ icon, label }: TrustItemProps) {
  return (
    <div className="flex items-center gap-2 text-pub-muted text-[12.5px] font-medium">
      <span className="w-7 h-7 rounded-lg bg-[hsl(142_60%_95%)] text-[hsl(142_60%_30%)] flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      {label}
    </div>
  );
}

export function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
      <TrustItem
        label="SSL cifrado"
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        }
      />
      <TrustItem
        label="Devolución garantizada"
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        }
      />
      <TrustItem
        label="RGPD · datos protegidos"
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        }
      />
    </div>
  );
}
