import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { SearchInput, FilterChip } from "@/components/ui";
import {
  Plus, FileText, Phone, Search, MoreHorizontal, Paperclip, Smile, Send,
  MessageCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  name: string;
  initials: string;
  gradFrom: string;
  gradTo: string;
  lastMessage: string;
  time: string;
  unread: number;
  isRead?: boolean;
  closed?: boolean;
  tag?: { label: string; cls: string };
}

interface WaStatus {
  connected: boolean;
  phone: string | null;
  connectedAt: string | null;
}

interface Message {
  id: string;
  mine: boolean;
  text: string;
  time: string;
  read?: boolean;
  day?: string;
}

// ── Static data (placeholder — replace with API when WhatsApp is connected) ──

const DEMO_CONVS: Conversation[] = [
  {
    id: "conv-1", name: "Ana López García", initials: "AL",
    gradFrom: "#34d399", gradTo: "#10b981",
    lastMessage: "Perfecto, entonces nos vemos el miérc…",
    time: "14:32", unread: 2,
    tag: { label: "📁 CERT-2026-0024", cls: "bg-primary/10 text-primary" },
  },
  {
    id: "conv-2", name: "Carmen Sánchez", initials: "CS",
    gradFrom: "#a78bfa", gradTo: "#7c3aed",
    lastMessage: "Aquí te paso la referencia catastral",
    time: "13:48", unread: 0, isRead: true,
    tag: { label: "⏱ Pdte. respuesta", cls: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" },
  },
  {
    id: "conv-3", name: "Javier Moreno Ruiz", initials: "JM",
    gradFrom: "#f87171", gradTo: "#dc2626",
    lastMessage: "No he recibido la factura, podrías rev…",
    time: "12:05", unread: 3,
    tag: { label: "⚠ Vencida", cls: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" },
  },
  {
    id: "conv-4", name: "Laura Pérez Martín", initials: "LP",
    gradFrom: "#60a5fa", gradTo: "#2563eb",
    lastMessage: "Gracias!! Cuando lo tengas me avisas",
    time: "Ayer", unread: 0, isRead: true,
  },
  {
    id: "conv-5", name: "Diego Gallardo", initials: "DG",
    gradFrom: "#fbbf24", gradTo: "#d97706",
    lastMessage: "📎 IMG_20260521_124508.jpg",
    time: "Ayer", unread: 1,
  },
  {
    id: "conv-6", name: "María Ramírez", initials: "MR",
    gradFrom: "#34d399", gradTo: "#059669",
    lastMessage: "Buenos días Javier, me llegó tu mensa…",
    time: "2 días", unread: 0,
  },
  {
    id: "conv-7", name: "Pablo Ruiz", initials: "PR",
    gradFrom: "#94a3b8", gradTo: "#475569",
    lastMessage: "Conversación cerrada",
    time: "3 días", unread: 0, closed: true,
  },
  {
    id: "conv-8", name: "+34 685 39 11 24", initials: "RT",
    gradFrom: "#a78bfa", gradTo: "#6d28d9",
    lastMessage: "Hola, quería saber el precio para un piso de…",
    time: "3 días", unread: 0,
    tag: { label: "✨ Nuevo lead", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  },
];

const DEMO_MESSAGES: Message[] = [
  { id: "m1", mine: false, day: "22 de mayo", time: "11:24",
    text: "Hola Javier 👋 Quería contratar la certificación energética para mi piso, ¿qué necesitas de mí?" },
  { id: "m2", mine: true, time: "11:26", read: true,
    text: "¡Hola Ana! Encantado 🙂 Para empezar necesito:\n· Dirección completa\n· Referencia catastral (si la tienes)\n· Cuándo te viene bien la visita técnica" },
  { id: "m3", mine: false, time: "11:28",
    text: "C/ Mayor 12, 3º A — 28013 Madrid\nLa catastral no la tengo a mano, lo siento" },
  { id: "m4", mine: true, time: "11:30", read: true,
    text: "Sin problema, la buscamos nosotros. ¿Te paso una propuesta?" },
  { id: "m5", mine: false, time: "12:18",
    text: "Perfecto, me parece bien. ¿Cuándo podrías venir?" },
  { id: "m6", mine: true, day: "Hoy", time: "14:30", read: true,
    text: "Tengo hueco mañana miércoles por la tarde. ¿16:45 te viene bien?" },
  { id: "m7", mine: false, time: "14:32",
    text: "Perfecto, entonces nos vemos el miércoles a las 16:45 🙂" },
  { id: "m8", mine: false, time: "14:32",
    text: "Avisa al portero, suele preguntar" },
];

const QUICK_REPLIES = [
  "✓ Confirmo visita",
  "📧 Envío la factura",
  "📍 Indicaciones para llegar",
  "⏱ Llegaré 10 min tarde",
  "📄 Mando el certificado",
];

const CONV_FILTERS = [
  { value: "all",    label: "Todas" },
  { value: "unread", label: "No leídas" },
  { value: "mine",   label: "Mías" },
  { value: "closed", label: "Cerradas" },
];

// WhatsApp SVG path (official icon)
const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={WA_PATH} />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WhatsApp() {
  // 360dialog connection state — comes from the server (/api/whatsapp/status)
  const { data: waStatus } = useQuery<WaStatus>({
    queryKey: ["/api/whatsapp/status"],
  });
  const connected = waStatus?.connected ?? false;

  const [convFilter, setConvFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Connect form (API key is validated server-side against 360dialog)
  const [showConnect, setShowConnect] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [phone, setPhone] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);

  const connectMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/whatsapp/connect", {
        apiKey: apiKey.trim(),
        phone: phone.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      setShowConnect(false);
      setApiKey("");
      setPhone("");
      setConnectError(null);
    },
    onError: (err: any) => {
      setConnectError(err?.message || "API key inválida o error de conexión con 360dialog");
    },
  });

  const handleConnect = () => {
    if (!showConnect) { setShowConnect(true); return; }
    if (!apiKey.trim()) {
      setConnectError("Introduce tu API key de 360dialog");
      return;
    }
    setConnectError(null);
    connectMutation.mutate();
  };

  const selectedConv = DEMO_CONVS.find(c => c.id === selectedConvId) ?? null;
  const unreadTotal  = DEMO_CONVS.reduce((s, c) => s + c.unread, 0);

  const filteredConvs = !connected ? [] : DEMO_CONVS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (convFilter === "unread") return c.unread > 0;
    if (convFilter === "closed") return !!c.closed;
    return true;
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar selectedTab="whatsapp" onTabChange={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Page header ── */}
        <header className="px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white">
                <WaIcon className="w-5 h-5" />
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${connected ? "bg-primary" : "bg-muted-foreground"}`} />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Buzón de WhatsApp</h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-primary" : "bg-muted-foreground"}`} />
                {connected
                  ? `${waStatus?.phone ?? "Número conectado"} · conectado · ${unreadTotal} sin leer`
                  : "Sin conexión · disponible en el plan Pro"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!connected}
              className="h-9 px-3 rounded-full border border-border bg-card text-xs font-medium hover:bg-muted/40 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText size={14} />
              Plantillas
            </button>
            <button
              disabled={!connected}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Nueva conversación
            </button>
          </div>
        </header>

        {/* ── 3-column layout ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr_320px] overflow-hidden">

          {/* ══ Left: Conversations list ══ */}
          <section className="bg-card border-r border-border flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border space-y-2.5 flex-shrink-0">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar conversaciones…"
              />
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {CONV_FILTERS.map(f => (
                  <FilterChip
                    key={f.value}
                    label={f.label}
                    count={
                      f.value === "all"
                        ? (connected ? DEMO_CONVS.length : 0)
                        : f.value === "unread"
                        ? (connected ? unreadTotal : 0)
                        : undefined
                    }
                    active={convFilter === f.value}
                    onClick={() => setConvFilter(f.value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!connected ? (
                <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <WaIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Sin conversaciones</p>
                  <p className="text-xs text-muted-foreground">
                    Conecta tu número para ver los mensajes
                  </p>
                </div>
              ) : (
                filteredConvs.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-border cursor-pointer transition-all ${
                      selectedConvId === conv.id
                        ? "bg-primary/[0.06] dark:bg-primary/[0.10] border-l-[3px] border-l-primary pl-[13px]"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${conv.gradFrom}, ${conv.gradTo})` }}
                    >
                      {conv.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${conv.closed ? "text-muted-foreground" : "text-foreground"}`}>{conv.name}</p>
                        <p className={`text-[10px] flex-shrink-0 ${conv.unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {conv.time}
                        </p>
                      </div>
                      <p className={`text-[11.5px] text-muted-foreground truncate mt-0.5 ${conv.closed ? "italic" : ""}`}>
                        {conv.lastMessage}
                      </p>
                      {(conv.tag || conv.unread > 0) && (
                        <div className="flex items-center justify-between mt-1.5 gap-2">
                          {conv.tag && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${conv.tag.cls}`}>
                              {conv.tag.label}
                            </span>
                          )}
                          {conv.unread > 0 && (
                            <span className="ml-auto bg-primary text-white min-w-[18px] h-[18px] px-[5px] rounded-full text-[10px] font-bold inline-flex items-center justify-center">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ══ Center: Chat window ══ */}
          <section className="flex flex-col overflow-hidden">
            {!connected ? (
              /* ── Not connected: full CTA ── */
              <div className="flex-1 flex items-center justify-center px-6 bg-background">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 rounded-3xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-5">
                    <WaIcon className="w-10 h-10 text-[#25D366]" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-1">WhatsApp Business</h2>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Próximamente en el plan Pro</p>
                  <p className="text-sm text-muted-foreground mb-8">
                    Conecta tu número para recibir y enviar mensajes directamente desde Certifive.
                    Por ahora puedes enviar mensajes manualmente desde cada expediente.
                  </p>
                  {showConnect && (
                    <div className="text-left space-y-3 mb-5">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-[5px]">
                          API key de 360dialog<span className="text-primary ml-0.5 font-bold">*</span>
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={e => { setApiKey(e.target.value); setConnectError(null); }}
                          placeholder="D360-XXXX…"
                          className="w-full min-h-[40px] px-3 py-2 bg-card border border-border rounded-lg text-[13.5px] text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.12] transition-all"
                        />
                        <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                          La encontrarás en tu panel de 360dialog. Se valida antes de guardarse.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-[5px]">
                          Número de WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+34 612 345 678"
                          className="w-full min-h-[40px] px-3 py-2 bg-card border border-border rounded-lg text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.12] transition-all"
                        />
                      </div>
                      {connectError && (
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">{connectError}</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleConnect}
                    disabled={connectMutation.isPending}
                    className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <WaIcon className="w-4 h-4" />
                    {connectMutation.isPending
                      ? "Validando API key…"
                      : showConnect ? "Validar y conectar" : "Conectar WhatsApp"}
                  </button>
                </div>
              </div>
            ) : selectedConv ? (
              /* ── Active chat ── */
              <>
                {/* Chat header */}
                <header className="px-5 py-3 border-b border-border bg-card flex items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${selectedConv.gradFrom}, ${selectedConv.gradTo})` }}
                    >
                      {selectedConv.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{selectedConv.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        En línea · +34 654 78 32 19
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-9 h-9 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground">
                      <Search size={16} />
                    </button>
                    <button className="w-9 h-9 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground">
                      <Phone size={16} />
                    </button>
                    <button className="w-9 h-9 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </header>

                {/* Pinned cert context bar */}
                <div className="px-4 py-2 bg-primary/[0.04] dark:bg-primary/10 border-b border-border flex items-center justify-between gap-3 text-xs flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-primary flex-shrink-0" />
                    <p className="truncate">
                      <span className="font-semibold text-foreground">Expediente CERT-2026-0024</span>
                      {" "}·{" "}
                      <span className="text-muted-foreground">C/ Mayor 12 · 242 €</span>
                    </p>
                  </div>
                  <button className="text-primary font-semibold hover:underline flex-shrink-0">Ver →</button>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-5 bg-[hsl(215_20%_96%)] dark:bg-[hsl(210_35%_10%)]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 15% 25%, hsl(var(--primary) / 0.04) 1.5px, transparent 2px)," +
                      "radial-gradient(circle at 65% 75%, hsl(var(--primary) / 0.04) 1.5px, transparent 2px)," +
                      "radial-gradient(circle at 85% 35%, hsl(var(--primary) / 0.03) 1.5px, transparent 2px)",
                    backgroundSize: "80px 80px",
                  }}
                >
                  <div className="max-w-3xl mx-auto flex flex-col gap-1.5">
                    {DEMO_MESSAGES.map(msg => (
                      <div key={msg.id}>
                        {msg.day && (
                          <div className="flex items-center justify-center my-4">
                            <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-[10.5px] font-semibold">
                              {msg.day}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] px-3 py-2 rounded-xl shadow-sm text-[13.5px] leading-[1.45] whitespace-pre-line ${
                              msg.mine
                                ? "bg-[hsl(142_60%_88%)] dark:bg-[hsl(142_50%_22%)] text-foreground rounded-br-[4px]"
                                : "bg-card text-foreground border border-border rounded-bl-[4px]"
                            }`}
                          >
                            {msg.text}
                            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                              {msg.time}
                              {msg.mine && msg.read && (
                                <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 7l3 3 6-7M6 10l3-3" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick replies */}
                <div className="px-4 py-2 border-t border-border bg-card flex items-center gap-2 overflow-x-auto flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">
                    Plantillas:
                  </p>
                  {QUICK_REPLIES.map(t => (
                    <button
                      key={t}
                      onClick={() => setMessage(t)}
                      className="px-3 py-1.5 rounded-[14px] bg-card border border-border text-xs font-medium text-foreground whitespace-nowrap hover:bg-primary/[0.08] hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Composer */}
                <div className="px-4 py-3 border-t border-border bg-card flex items-end gap-2 flex-shrink-0">
                  <button className="w-10 h-10 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Paperclip size={20} />
                  </button>
                  <button className="w-10 h-10 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Smile size={20} />
                  </button>
                  <textarea
                    rows={1}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje…"
                    className="flex-1 max-h-32 px-4 py-2.5 bg-muted/40 border border-border rounded-2xl text-sm placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-primary resize-none"
                  />
                  <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center flex-shrink-0 hover:opacity-90 shadow-sm">
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              /* ── No conv selected ── */
              <div className="flex-1 flex items-center justify-center text-center px-6 bg-background">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Selecciona una conversación</p>
                  <p className="text-xs text-muted-foreground">
                    Elige un chat de la lista para ver los mensajes
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ══ Right: Customer panel ══ */}
          <aside className="hidden lg:flex bg-card border-l border-border flex-col overflow-hidden">
            {!connected || !selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground mb-1">Datos del contacto</p>
                <p className="text-xs text-muted-foreground">
                  {!connected
                    ? "Disponible al conectar WhatsApp"
                    : "Selecciona una conversación"}
                </p>
              </div>
            ) : (
              <>
                {/* Avatar + name */}
                <div className="p-5 text-center border-b border-border flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${selectedConv.gradFrom}, ${selectedConv.gradTo})` }}
                  >
                    {selectedConv.initials}
                  </div>
                  <p className="text-base font-bold text-foreground mt-3">{selectedConv.name}</p>
                  <p className="text-[11px] text-muted-foreground">Cliente desde may 2026</p>
                  <div className="flex gap-2 mt-3 justify-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      ⭐ VIP
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                      Particular
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* Contact details */}
                  <div className="px-5 py-4 border-b border-border space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-foreground">+34 654 78 32 19</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <p className="text-xs text-foreground truncate">ana.lopez@gmail.com</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <p className="text-xs text-foreground leading-relaxed">
                        C/ Mayor 12, 3º A<br />28013 Madrid
                      </p>
                    </div>
                  </div>

                  {/* Linked expediente */}
                  <div className="px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Expedientes (1)
                      </p>
                      <button className="text-[10px] font-semibold text-primary hover:underline">
                        + Nuevo
                      </button>
                    </div>
                    <div className="rounded-xl border border-border hover:border-primary transition-colors p-3 cursor-pointer">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-foreground">CERT-2026-0024</p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary">
                          En curso
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Visita mañana 16:45 · 242 €</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="px-5 py-4 border-b border-border">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Etiquetas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        vivienda
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        venta urgente
                      </span>
                      <button className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-dashed border-border text-muted-foreground hover:text-foreground">
                        + añadir
                      </button>
                    </div>
                  </div>

                  {/* Private notes */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Notas privadas
                    </p>
                    <textarea
                      className="w-full text-xs bg-muted/30 border border-border rounded-lg p-3 min-h-[80px] resize-none placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      defaultValue="Vende el piso, factura a su nombre. Llamar al portero del 3º B si no responde."
                    />
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
