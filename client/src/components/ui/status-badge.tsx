import { cn } from "@/lib/utils";

type Status =
  | "Nuevo"
  | "En Proceso"
  | "Finalizado"
  | "Vencido"
  | "Pendiente"
  | "Pagada"
  | (string & Record<never, never>); // allows any string while keeping autocomplete

interface Variant {
  pill: string;
  dot: string;
  label: string;
}

const VARIANTS: Record<string, Variant> = {
  Nuevo: {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    dot:  "bg-blue-500",
    label: "Nuevo",
  },
  "En Proceso": {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot:  "bg-amber-500",
    label: "En Proceso",
  },
  Finalizado: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot:  "bg-emerald-500",
    label: "Finalizado",
  },
  Vencido: {
    pill: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    dot:  "bg-red-500",
    label: "Vencido",
  },
  Pendiente: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot:  "bg-amber-400",
    label: "Pendiente",
  },
  Pagada: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot:  "bg-emerald-500",
    label: "Pagada",
  },
  // Estados de suscripción (panel admin) — mismas claves que users.subscriptionStatus
  active: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot:  "bg-emerald-500",
    label: "Activo",
  },
  trialing: {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    dot:  "bg-blue-500",
    label: "Prueba",
  },
  canceled: {
    pill: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    dot:  "bg-red-500",
    label: "Cancelado",
  },
  past_due: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot:  "bg-amber-500",
    label: "Pago pendiente",
  },
  incomplete: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot:  "bg-amber-400",
    label: "Incompleto",
  },
  free: {
    pill: "bg-muted text-muted-foreground",
    dot:  "bg-muted-foreground/50",
    label: "Gratuito",
  },
};

const FALLBACK: Variant = {
  pill: "bg-muted text-muted-foreground",
  dot:  "bg-muted-foreground/50",
  label: "",
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const v = VARIANTS[status] ?? { ...FALLBACK, label: status };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "text-[11px] font-semibold whitespace-nowrap",
        v.pill,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", v.dot)} />
      {v.label}
    </span>
  );
}
