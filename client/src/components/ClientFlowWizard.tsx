import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  MessageCircle,
  CreditCard,
  FileText,
  Copy,
  ExternalLink,
  Euro,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

interface CertFull {
  id: number;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  cadastralRef: string | null;
  propertyAddress: string | null;
  address: string | null;
  city: string | null;
  workflowStatus: string | null;
  presupuestoStatus: string | null;
  presupuestoToken: string | null;
  paymentToken: string | null;
  ceeToken: string | null;
  solicitudToken: string | null;
  finalPrice: string | null;
  tramo1Amount: string | null;
  tramo2Amount: string | null;
  ceeFormStatus: string | null;
  ceeFormSentAt: string | null;
  tramo1PaidAt: string | null;
  presupuestoSentAt: string | null;
}

type StepStatus = "done" | "active" | "locked";
type Channel = "email" | "whatsapp";

function getStepStatuses(ws: string | null | undefined): [StepStatus, StepStatus, StepStatus] {
  const s = ws ?? "nuevo";
  if (["formulario_cee_completado", "formulario_cee_abierto"].includes(s))   return ["done", "done", "done"];
  if (["formulario_cee_enviado", "pago_1_confirmado"].includes(s))           return ["done", "done", "active"];
  if (["presupuesto_aceptado", "pago_1_pendiente"].includes(s))              return ["done", "active", "locked"];
  if (s === "presupuesto_enviado")                                            return ["active", "active", "locked"];
  return ["active", "locked", "locked"];
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

function waLink(phone: string, text: string): string {
  const p = formatPhone(phone);
  if (!p) return "#";
  return `https://wa.me/${p.startsWith("34") ? p : "34" + p}?text=${encodeURIComponent(text)}`;
}

function StepBadge({ status, n }: { status: StepStatus; n: number }) {
  if (status === "done")   return <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-white" /></div>;
  if (status === "active") return <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 ring-4 ring-teal-100"><span className="text-white font-bold text-sm">{n}</span></div>;
  return <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><Lock className="w-3.5 h-3.5 text-gray-400" /></div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={handle} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="Copiar enlace">
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function LinkRow({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
      <span className="flex-1 text-xs text-gray-600 truncate font-mono">{url}</span>
      <CopyButton text={url} />
      <a href={url} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title={`Abrir ${label}`}>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function ChannelSelector({ value, onChange, hasEmail, hasPhone }: {
  value: Channel; onChange: (c: Channel) => void;
  hasEmail: boolean; hasPhone: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("email")}
        disabled={!hasEmail}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
          value === "email" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Mail className="w-3.5 h-3.5" />
        Email
      </button>
      <button
        onClick={() => onChange("whatsapp")}
        disabled={!hasPhone}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
          value === "whatsapp" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </button>
    </div>
  );
}

export default function ClientFlowWizard({
  certId,
  open,
  onClose,
}: {
  certId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const origin = window.location.origin;

  const [ch1, setCh1] = useState<Channel>("email");
  const [ch3, setCh3] = useState<Channel>("email");
  const [price, setPrice] = useState("");
  const [priceSent, setPriceSent] = useState(false);

  const { data: cert, isLoading, refetch } = useQuery<CertFull>({
    queryKey: ["/api/certifications", certId],
    enabled: open,
    refetchInterval: open ? 6000 : false,
  });

  useEffect(() => {
    if (cert?.finalPrice && !price) setPrice(parseFloat(cert.finalPrice).toFixed(2));
  }, [cert?.finalPrice]);

  useEffect(() => {
    if (!open) { setPriceSent(false); }
  }, [open]);

  const ws = cert?.workflowStatus;
  const [s1, s2, s3] = getStepStatuses(ws);

  const presupuestoUrl = cert?.presupuestoToken ? `${origin}/presupuesto/${cert.presupuestoToken}` : null;
  const payUrl         = cert?.paymentToken     ? `${origin}/pay/${cert.paymentToken}`             : null;
  const ceeUrl         = cert?.ceeToken         ? `${origin}/formulario-cee/${cert.ceeToken}`       : null;

  const hasEmail = !!cert?.ownerEmail;
  const hasPhone = !!cert?.ownerPhone;

  const generatePresupuestoMutation = useMutation({
    mutationFn: async () => {
      const finalPrice = parseFloat(price) || 0;
      const data = await apiRequest("POST", `/api/certifications/${certId}/generate-presupuesto`, { finalPrice });
      return data as { token: string; url: string; emailSent: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", certId] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setPriceSent(true);
      if (ch1 === "email" && data.emailSent) {
        toast({ title: "Tarifa enviada por email ✉️", description: `Enviada a ${cert?.ownerEmail}` });
      } else if (ch1 === "email" && !data.emailSent) {
        toast({ title: "Enlace generado", description: "No hay email del cliente. Envíalo por WhatsApp o copia el enlace.", variant: "destructive" });
      }
      if (ch1 === "whatsapp") {
        const url = data.url;
        const msg = `¡Hola ${cert?.ownerName ?? ""}! Te enviamos tu presupuesto personalizado para la certificación energética de tu inmueble. Puedes revisarlo y aceptarlo en este enlace:\n\n${url}`;
        window.open(waLink(cert?.ownerPhone ?? "", msg), "_blank");
      }
    },
    onError: () => toast({ title: "Error", description: "No se pudo generar el presupuesto.", variant: "destructive" }),
  });

  const resendPresupuestoMutation = useMutation({
    mutationFn: async () => {
      const data = await apiRequest("POST", `/api/certifications/${certId}/generate-presupuesto`, {
        finalPrice: cert?.finalPrice ? parseFloat(cert.finalPrice as string) : 0,
      });
      return data as { token: string; url: string; emailSent: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", certId] });
      if (ch1 === "email" && data.emailSent) {
        toast({ title: "Tarifa reenviada ✉️", description: `Enviada a ${cert?.ownerEmail}` });
      }
      if (ch1 === "whatsapp" && presupuestoUrl) {
        const msg = `¡Hola ${cert?.ownerName ?? ""}! Aquí tienes de nuevo tu presupuesto para la certificación energética:\n\n${presupuestoUrl}`;
        window.open(waLink(cert?.ownerPhone ?? "", msg), "_blank");
      }
    },
    onError: () => toast({ title: "Error", description: "No se pudo reenviar.", variant: "destructive" }),
  });

  const generateCeeMutation = useMutation({
    mutationFn: async () => {
      const data = await apiRequest("POST", `/api/certifications/${certId}/generate-cee-form`, {});
      return data as { token: string; url: string; emailSent: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", certId] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      if (ch3 === "email" && data.emailSent) {
        toast({ title: "Formulario CEE enviado ✉️", description: `Enviado a ${cert?.ownerEmail}` });
      } else if (ch3 === "email" && !data.emailSent) {
        toast({ title: "Enlace CEE generado", description: "No hay email del cliente. Copia el enlace manualmente." });
      }
      if (ch3 === "whatsapp") {
        const url = data.url;
        const msg = `¡Hola ${cert?.ownerName ?? ""}! Tu pago ha sido confirmado. Por favor, rellena el formulario de certificación energética en este enlace:\n\n${url}\n\nNos pondremos en contacto contigo cuando el certificado esté listo.`;
        window.open(waLink(cert?.ownerPhone ?? "", msg), "_blank");
      }
    },
    onError: () => toast({ title: "Error", description: "No se pudo generar el formulario CEE.", variant: "destructive" }),
  });

  const step1Done = s1 === "done";
  const step2Done = s2 === "done";
  const step3Done = s3 === "done";

  const payStatus = (() => {
    if (!ws) return null;
    if (ws === "pago_1_confirmado" || ws === "formulario_cee_enviado" || ws === "formulario_cee_completado") return "paid";
    if (ws === "presupuesto_aceptado") return "accepted_not_paid";
    if (ws === "presupuesto_enviado") return "sent_not_accepted";
    return null;
  })();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-gray-900">Enviar a cliente</DialogTitle>
              <p className="text-sm text-gray-500 truncate">
                {cert?.ownerName ?? "—"} · {cert?.cadastralRef ?? cert?.address ?? ""}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Actualizar estado"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Step tracker */}
          <div className="flex items-center gap-2 mt-4">
            {[
              { n: 1, label: "Enviar tarifa",   status: s1 },
              { n: 2, label: "Confirmar pago",  status: s2 },
              { n: 3, label: "Enviar CEE",      status: s3 },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-2 flex-1 min-w-0">
                <StepBadge status={step.status} n={step.n} />
                <span className={`text-xs font-medium truncate ${
                  step.status === "active" ? "text-teal-700" :
                  step.status === "done"   ? "text-gray-700" : "text-gray-400"
                }`}>{step.label}</span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
          </div>
        ) : (
          <div className="p-6 space-y-4">

            {/* ─── STEP 1: Enviar tarifa ─── */}
            <div className={`rounded-2xl border-2 p-5 transition-all ${
              s1 === "active" ? "border-teal-300 bg-white" :
              s1 === "done"  ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-gray-50 opacity-60"
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <StepBadge status={s1} n={1} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">Paso 1 — Enviar tarifa al cliente</h3>
                    {s1 === "done" && <Badge className="bg-teal-100 text-teal-700 text-xs">✅ Enviado</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    El cliente podrá revisar y aceptar la tarifa personalizada desde su enlace.
                  </p>
                </div>
              </div>

              {!presupuestoUrl ? (
                /* First time: need to set price and generate */
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wizard-price" className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                      <Euro className="w-3.5 h-3.5 text-teal-600" />
                      Precio final del servicio (€)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="wizard-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="Ej: 150.00"
                        className="max-w-[180px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <ChannelSelector value={ch1} onChange={setCh1} hasEmail={hasEmail} hasPhone={hasPhone} />
                    {!hasEmail && !hasPhone && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        El cliente no tiene email ni teléfono. Añádelos primero.
                      </p>
                    )}
                  </div>
                  <Button
                    className="bg-teal-700 hover:bg-teal-600 text-white gap-2"
                    onClick={() => generatePresupuestoMutation.mutate()}
                    disabled={generatePresupuestoMutation.isPending || (!price && !parseFloat(price))}
                  >
                    {generatePresupuestoMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      ch1 === "email" ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />
                    )}
                    {generatePresupuestoMutation.isPending ? "Generando..." : `Generar y enviar tarifa por ${ch1 === "email" ? "Email" : "WhatsApp"}`}
                  </Button>
                </div>
              ) : (
                /* Already generated */
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Enlace de la tarifa</p>
                    <LinkRow url={presupuestoUrl} label="tarifa" />
                  </div>
                  {cert?.finalPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Importe total:</span>
                      <span className="font-semibold text-gray-800">{parseFloat(cert.finalPrice).toFixed(2)} €</span>
                      {cert.tramo1Amount && (
                        <span className="text-xs text-gray-400">· Tramo 1: {parseFloat(cert.tramo1Amount).toFixed(2)} €</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <ChannelSelector value={ch1} onChange={setCh1} hasEmail={hasEmail} hasPhone={hasPhone} />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50"
                      onClick={() => resendPresupuestoMutation.mutate()}
                      disabled={resendPresupuestoMutation.isPending}
                    >
                      {resendPresupuestoMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Reenviar por {ch1 === "email" ? "Email" : "WhatsApp"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── STEP 2: Confirmar pago ─── */}
            <div className={`rounded-2xl border-2 p-5 transition-all ${
              s2 === "active" ? "border-teal-300 bg-white" :
              s2 === "done"  ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-gray-50 opacity-50 pointer-events-none"
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <StepBadge status={s2} n={2} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">Paso 2 — El cliente acepta y paga</h3>
                    {s2 === "done" && <Badge className="bg-teal-100 text-teal-700 text-xs">✅ Pago confirmado</Badge>}
                    {s2 === "active" && payStatus === "accepted_not_paid" && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs animate-pulse">⏳ Tarifa aceptada — Esperando pago</Badge>
                    )}
                    {s2 === "active" && payStatus === "sent_not_accepted" && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">⏳ Esperando que el cliente acepte</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    El sistema detecta automáticamente el pago. Se actualiza cada 6 segundos.
                  </p>
                </div>
              </div>

              {s2 !== "locked" && (
                <div className="space-y-3">
                  {/* Payment status cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        icon: <FileText className="w-4 h-4" />,
                        label: "Tarifa",
                        state: cert?.presupuestoStatus === "aceptado" ? "done" : (cert?.presupuestoToken ? "pending" : "waiting"),
                        desc: cert?.presupuestoStatus === "aceptado" ? "Aceptada por el cliente" : "Esperando aceptación",
                      },
                      {
                        icon: <CreditCard className="w-4 h-4" />,
                        label: "Pago Tramo 1",
                        state: cert?.tramo1PaidAt ? "done" : "pending",
                        desc: cert?.tramo1PaidAt
                          ? `Confirmado ${new Date(cert.tramo1PaidAt).toLocaleDateString("es-ES")}`
                          : cert?.tramo1Amount
                            ? `${parseFloat(cert.tramo1Amount).toFixed(2)} € pendiente`
                            : "Pendiente",
                      },
                    ].map(item => (
                      <div key={item.label} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                        item.state === "done" ? "border-teal-200 bg-teal-50" :
                        item.state === "pending" ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"
                      }`}>
                        <div className={`mt-0.5 ${item.state === "done" ? "text-teal-600" : item.state === "pending" ? "text-amber-600" : "text-gray-400"}`}>
                          {item.state === "done" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pay link */}
                  {payUrl && !cert?.tramo1PaidAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Enlace de pago directo (compártelo si el cliente necesita el link)</p>
                      <LinkRow url={payUrl} label="pago" />
                    </div>
                  )}

                  {s2 === "active" && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Actualizando automáticamente...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── STEP 3: Enviar formulario CEE ─── */}
            <div className={`rounded-2xl border-2 p-5 transition-all ${
              s3 === "active" ? "border-teal-300 bg-white" :
              s3 === "done"  ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-gray-50 opacity-50 pointer-events-none"
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <StepBadge status={s3} n={3} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">Paso 3 — Enviar formulario CEE al cliente</h3>
                    {s3 === "done" && cert?.ceeFormStatus === "completado" && (
                      <Badge className="bg-teal-100 text-teal-700 text-xs">✅ Formulario completado</Badge>
                    )}
                    {s3 === "done" && cert?.ceeFormStatus !== "completado" && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">📤 Formulario enviado</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    El cliente rellena sus datos para generar el certificado oficial.
                  </p>
                </div>
              </div>

              {s3 !== "locked" && (
                <div className="space-y-3">
                  {ceeUrl ? (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Enlace del formulario CEE</p>
                        <LinkRow url={ceeUrl} label="formulario CEE" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <ChannelSelector value={ch3} onChange={setCh3} hasEmail={hasEmail} hasPhone={hasPhone} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50"
                          onClick={() => generateCeeMutation.mutate()}
                          disabled={generateCeeMutation.isPending}
                        >
                          {generateCeeMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Reenviar por {ch3 === "email" ? "Email" : "WhatsApp"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-wrap">
                        <ChannelSelector value={ch3} onChange={setCh3} hasEmail={hasEmail} hasPhone={hasPhone} />
                      </div>
                      <Button
                        className="bg-teal-700 hover:bg-teal-600 text-white gap-2"
                        onClick={() => generateCeeMutation.mutate()}
                        disabled={generateCeeMutation.isPending}
                      >
                        {generateCeeMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          ch3 === "email" ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />
                        )}
                        {generateCeeMutation.isPending ? "Enviando..." : `Enviar formulario por ${ch3 === "email" ? "Email" : "WhatsApp"}`}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* All done */}
            {step1Done && step2Done && step3Done && cert?.ceeFormStatus === "completado" && (
              <div className="rounded-2xl border-2 border-teal-300 bg-teal-50 p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <h3 className="font-semibold text-teal-900 text-lg">¡Flujo completado! 🎉</h3>
                <p className="text-sm text-teal-700 mt-1">
                  El cliente ha rellenado el formulario CEE. Ya puedes generar el certificado oficial.
                </p>
              </div>
            )}

            {/* Contact info footer */}
            <div className="flex items-center gap-4 px-1 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Mail className="w-3 h-3" />
                {cert?.ownerEmail ?? <span className="italic">Sin email</span>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <MessageCircle className="w-3 h-3" />
                {cert?.ownerPhone ?? <span className="italic">Sin teléfono</span>}
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
