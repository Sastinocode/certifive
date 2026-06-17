import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationModal } from "@/components/notifications/NotificationModal";

interface AppTopbarProps {
  /** Greeting ("Hola, Marcos 👋") or page title ("Expedientes"). */
  title: ReactNode;
  /** Second line — date for Dashboard, subtitle for other pages. */
  subtitle?: string;
}

export function AppTopbar({ title, subtitle }: AppTopbarProps) {
  const { user } = useAuth();

  const initials = (user?.firstName && user?.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : ((user as any)?.email?.[0] || "U").toUpperCase();

  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : (user as any)?.email || "Usuario";

  return (
    <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20">
      {/* Left */}
      <div>
        {typeof title === "string" ? (
          <h1 className="text-2xl font-bold text-foreground tracking-tight leading-none">{title}</h1>
        ) : (
          <div className="text-2xl font-bold text-foreground tracking-tight leading-none">{title}</div>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{subtitle}</p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
          <p className="text-xs text-muted-foreground">Certificador energético</p>
        </div>
        <ThemeToggle />
        <NotificationModal />
        <div
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 select-none"
          title={user?.firstName ?? ""}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
