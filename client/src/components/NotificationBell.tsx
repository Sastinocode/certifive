/**
 * NotificationBell
 *
 * Bell icon with unread-count badge + dropdown panel.
 * - Badge disappears when unreadCount === 0
 * - Panel shows last 20 notifications
 * - Clicking a notification → calls onNavigate("certifications") AND marks it read
 * - "Marcar todas como leídas" button at the top
 * - Timestamps are formatted as relative time ("hace 5 min")
 * - Closes when clicking outside
 */

import { useState, useRef, useEffect } from "react";
import { useNotifications, type Notificacion } from "../hooks/useNotifications";

type Page = "dashboard" | "certifications" | "properties" | "whatsapp" | "invoices" | "marketing" | "settings";

interface Props {
  onNavigate: (page: Page) => void;
}

// ── Relative-time formatter ───────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "ahora mismo";
  const m = Math.floor(s / 60);
  if (m < 60)  return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

// ── Icon per notification type ────────────────────────────────────────────────

const TIPO_META: Record<string, { icon: string; color: string; bg: string }> = {
  solicitud_completada:    { icon: "assignment_turned_in", color: "text-blue-600",   bg: "bg-blue-50"   },
  presupuesto_aceptado:    { icon: "thumb_up",             color: "text-indigo-600", bg: "bg-indigo-50" },
  pago_recibido:           { icon: "payments",             color: "text-emerald-600",bg: "bg-emerald-50"},
  pago_fallido:            { icon: "money_off",            color: "text-red-600",    bg: "bg-red-50"    },
  cee_completado:          { icon: "fact_check",           color: "text-teal-600",   bg: "bg-teal-50"   },
  recordatorio_formulario: { icon: "schedule",             color: "text-amber-600",  bg: "bg-amber-50"  },
};
const DEFAULT_META = { icon: "notifications", color: "text-stone-500", bg: "bg-stone-100" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationBell({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleNotifClick = (n: Notificacion) => {
    if (!n.leida) markRead(n.id);
    if (n.certificationId) onNavigate("certifications");
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* ── Bell button ── */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-100 transition-colors text-emerald-700"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
      >
        <span className="material-symbols-outlined text-[22px]"
          style={unreadCount > 0 ? { fontVariationSettings: "'FILL' 1" } : {}}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-emerald-100/60 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-emerald-50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">notifications</span>
              <h3 className="text-sm font-bold text-emerald-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  {unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-emerald-50/80">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-emerald-300 text-[40px] block mb-2">notifications_off</span>
                <p className="text-sm font-semibold text-emerald-900">Sin notificaciones</p>
                <p className="text-xs text-emerald-700/50 mt-1">Te avisaremos cuando haya actividad</p>
              </div>
            ) : (
              notifications.map(n => {
                const meta = TIPO_META[n.tipo] ?? DEFAULT_META;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-emerald-50/60 transition-colors ${!n.leida ? "bg-emerald-50/30" : ""}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`material-symbols-outlined text-[16px] ${meta.color}`}>
                        {meta.icon}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.leida ? "text-stone-600" : "text-stone-900 font-semibold"}`}>
                        {n.mensaje}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.leida && (
                      <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-emerald-50 flex items-center justify-between">
              <p className="text-[10px] text-stone-400">
                Últimas {notifications.length} notificaciones
              </p>
              <button
                onClick={() => { onNavigate("certifications"); setOpen(false); }}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                Ver certificaciones →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
