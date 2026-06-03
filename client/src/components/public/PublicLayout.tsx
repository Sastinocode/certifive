import { ReactNode } from "react";
import { Link } from "wouter";

export type HeaderVariant =
  | "marketing"   // pricing page: nav (Preguntas) + "Solicitar ahora" CTA
  | "form"        // steps 1-3: nav (Cómo funciona) + padlock "Conexión segura"
  | "payment"     // step 4: no nav + "Pago cifrado SSL · 256-bit"
  | "success"     // confirmation: no nav + "Ver estado del pedido" ghost btn
  | "tracking"    // seguimiento: no nav + green dot live indicator
  | "rejected";   // payment error: no nav + padlock "Conexión segura"

interface PublicHeaderProps {
  backHref?: string;
  variant?: HeaderVariant;
  rightSlot?: ReactNode;
}

export function PublicHeader({ backHref = "/", variant = "form", rightSlot }: PublicHeaderProps) {
  const showNav = variant === "marketing" || variant === "form";

  function buildRight(): ReactNode {
    switch (variant) {
      case "marketing":
        return (
          <Link
            href="/solicitud-cee"
            className="hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-full bg-pub-primary text-white text-sm font-semibold hover:bg-pub-primary-dark transition-colors no-underline"
          >
            Solicitar ahora
          </Link>
        );
      case "payment":
        return (
          <div className="hidden sm:flex items-center gap-2 text-xs text-pub-muted">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Pago cifrado SSL · 256-bit
          </div>
        );
      case "success":
        return (
          <Link
            href="/solicitud-cee/seguimiento"
            className="hidden sm:inline-flex items-center h-9 px-4 rounded-full border border-pub-border text-[13px] font-semibold text-pub-ink hover:bg-gray-50 transition-colors no-underline"
          >
            Ver estado del pedido
          </Link>
        );
      case "tracking":
        return (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-pub-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-dot absolute inline-flex h-full w-full rounded-full bg-pub-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pub-primary" />
            </span>
            Actualizado recientemente
          </div>
        );
      default: // "form" | "rejected"
        return (
          <div className="hidden sm:flex items-center gap-2 text-xs text-pub-muted">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Conexión segura
          </div>
        );
    }
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-lg bg-pub-primary text-white font-bold flex items-center justify-center text-base">C</div>
          <div>
            <p className="text-sm font-bold text-pub-ink leading-none">Certifive</p>
            <p className="text-[10px] text-pub-muted mt-0.5">Certificación energética</p>
          </div>
        </Link>

        {showNav && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-pub-muted">
            <Link href="/precios" className="hover:text-pub-ink no-underline">Precios</Link>
            <a href="#como-funciona" className="hover:text-pub-ink">Cómo funciona</a>
            <a href="mailto:hola@certifive.app" className="hover:text-pub-ink">Contacto</a>
          </nav>
        )}

        {rightSlot ?? buildRight()}
      </div>
    </header>
  );
}

interface PublicLayoutProps {
  children: ReactNode;
  backHref?: string;
  variant?: HeaderVariant;
  rightSlot?: ReactNode;
}

export function PublicLayout({ children, backHref, variant = "form", rightSlot }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-pub-bg font-sans">
      <PublicHeader backHref={backHref} variant={variant} rightSlot={rightSlot} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-pub-border bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-pub-muted">
          <p>© {new Date().getFullYear()} Certifive Soluciones Energéticas S.L.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-pub-ink no-underline">Privacidad</Link>
            <Link href="/terms" className="hover:text-pub-ink no-underline">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
