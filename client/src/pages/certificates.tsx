import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnergyChip } from "@/components/ui/energy-chip";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { downloadPDF, downloadWord, downloadExcel } from "@/lib/certDownload";
import ClientFlowWizard from "@/components/ClientFlowWizard";
import { CertDetailPanel } from "@/components/CertDetailPanel";
import {
  IdCard,
  Plus,
  Search,
  Download,
  Eye,
  MoreVertical,
  FileText,
  Sheet,
  File,
  Archive,
  Copy,
  ExternalLink,
  X,
  Link2,
  FileCheck,
  FileCheck2,
  FileCode,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Wallet,
  Send,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Users2,
  Share2,
  Trash2,
  UserCheck
} from "lucide-react";

const PAGE_SIZE = 20;

interface Certification {
  id: number;
  ownerName: string;
  ownerDni: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  propertyAddress: string;
  email: string | null;
  phone: string | null;
  cadastralRef: string;
  energyRating: string | null;
  status: string;
  workflowStatus: string | null;
  presupuestoStatus: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  folderId: number | null;
  userId: number;
  rooms: number | null;
  facadeOrientation: string | null;
  heatingSystem: string | null;
  waterHeatingType: string | null;
  buildingFloors: number | null;
  propertyFloors: number | null;
  windowDetails: string | null;
  roofType: string | null;
  airConditioningSystem: string | null;
  presupuestoToken: string | null;
  paymentToken: string | null;
  ceeToken: string | null;
  solicitudToken: string | null;
  finalPrice: string | null;
  tramo1Amount: string | null;
  tramo2Amount: string | null;
  tramo1PaidAt: string | null;
  ceeFormStatus: string | null;
  ceeFormSentAt: string | null;
  tecnicoFormStatus: string | null;
  tecnicoFormToken: string | null;
  tecnicoFormReviewStatus: string | null;
}

interface SharedCert {
  shareId: number;
  permission: string;
  invitedAt: string;
  certId: number;
  ownerName: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  status: string;
  energyRating: string | null;
  createdAt: string;
}

interface PreviewLink {
  label: string;
  url: string;
  icon: React.ReactNode;
}

function ClientLinkPreviewModal({
  open,
  onClose,
  links,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  links: PreviewLink[];
  clientName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { toast } = useToast();

  const activeLink = links[activeIndex];

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Enlace copiado", description: "URL copiada al portapapeles" });
    });
  };

  if (!open || links.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {"Enlaces de cliente — "}{clientName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {links.length > 1 && (
            <div className="flex gap-2 mt-3">
              {links.map((link, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeIndex === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="px-6 py-3 bg-muted/50 border-b border-border flex-shrink-0 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground font-mono truncate">
            <span className="truncate">{activeLink?.url}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(activeLink?.url)} className="flex-shrink-0 gap-1">
            <Copy className="w-4 h-4" />Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(activeLink?.url, "_blank")} className="flex-shrink-0 gap-1">
            <ExternalLink className="w-4 h-4" />Abrir
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe key={activeLink?.url} src={activeLink?.url} className="w-full h-full border-0" title={activeLink?.label} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PendingPayment {
  id: number;
  certificationId: number | null;
  amount: string;
  metodo: string;
  tramo: number | null;
  notas: string | null;
  estadoConfirmacion: string;
  fechaNotificacion: string | null;
  ownerName: string | null;
  address: string | null;
  city: string | null;
}

const METHOD_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  bizum:         { label: "Bizum",         icon: "🟣", color: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700" },
  transferencia: { label: "Transferencia", icon: "🏦", color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" },
  efectivo:      { label: "Efectivo",      icon: "💵", color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" },
  stripe:        { label: "Tarjeta",       icon: "💳", color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function WorkflowBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const s = status.toLowerCase();
  const cls =
    s.includes("entregado") || s.includes("finalizado")
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : s.includes("pago") || s.includes("pendiente") || s.includes("cobro")
      ? "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
      : s.includes("cee") || s.includes("enviado") || s.includes("envio")
      ? "bg-teal-50 text-teal-700 border border-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/40"
      : s.includes("tasacion") || s.includes("presupuesto") || s.includes("nuevo")
      ? "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40"
      : "bg-muted/60 text-muted-foreground border border-border";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [previewCert, setPreviewCert] = useState<Certification | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [wizardCertId, setWizardCertId] = useState<number | null>(null);
  const [detailCertId, setDetailCertId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [exportingCE3XId, setExportingCE3XId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"mine" | "shared">("mine");
  const [sharingCertId, setSharingCertId] = useState<number | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const handleStatusFilter = (value: string) => { setStatusFilter(value); setPage(1); };

  const { data: certData, isLoading } = useQuery({
    queryKey: ["/api/certifications", { page, pageSize: PAGE_SIZE, search: debouncedSearch, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/certifications?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando certificaciones");
      return res.json() as Promise<{ data: Certification[]; total: number; page: number; pageSize: number }>;
    },
    placeholderData: (prev) => prev,
  });

  const certList: Certification[] = certData?.data ?? [];
  const totalCount: number = certData?.total ?? 0;
  const totalPages: number = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["/api/payments/pending"],
    refetchInterval: 30000,
  });

  const { data: sharedWithMe = [] } = useQuery<SharedCert[]>({
    queryKey: ["/api/shared-with-me"],
    enabled: activeTab === "shared",
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => apiRequest("POST", `/api/payments/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      toast({ title: "Pago confirmado", description: "El pago ha sido verificado y el cliente ha sido notificado." });
    },
    onError: () => { toast({ title: "Error", description: "No se pudo confirmar el pago.", variant: "destructive" }); },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => apiRequest("POST", `/api/payments/${id}/reject`, { motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] });
      setRejectingId(null);
      setRejectMotivo("");
      toast({ title: "Pago rechazado", description: "El pago ha sido marcado como rechazado." });
    },
    onError: () => { toast({ title: "Error", description: "No se pudo rechazar el pago.", variant: "destructive" }); },
  });

  const handleDownload = async (cert: Certification, format: "pdf" | "word" | "excel") => {
    setDownloadingId(cert.id);
    try {
      if (format === "pdf") {
        downloadPDF(cert);
        toast({ title: "PDF generado", description: `CEE_${cert.cadastralRef || cert.id}_*.pdf descargado correctamente.` });
      } else if (format === "word") {
        await downloadWord(cert);
        toast({ title: "Word generado", description: `CEE_${cert.cadastralRef || cert.id}_*.docx descargado correctamente.` });
      } else {
        downloadExcel(cert);
        toast({ title: "Excel generado", description: `CEE_${cert.cadastralRef || cert.id}_*.xlsx descargado correctamente.` });
      }
    } catch (err) {
      console.error("Error generando documento:", err);
      toast({ title: "Error al generar el documento", description: `No se pudo crear el archivo ${format.toUpperCase()}.`, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  async function handleExportCE3X(certId: number) {
    setExportingCE3XId(certId);
    try {
      const res = await fetch(`/api/certifications/${certId}/export-ce3x.xml`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `CEE_cert_${certId}.xml`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CE3X exportado", description: filename });
    } catch {
      toast({ title: "Error", description: "No se pudo generar el XML CE3X", variant: "destructive" });
    } finally {
      setExportingCE3XId(null);
    }
  }

  const archiveCertificationMutation = useMutation({
    mutationFn: async (certificationId: number) => apiRequest("POST", `/api/certifications/${certificationId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      toast({ title: "Certificacion archivada", description: "La certificacion se ha movido a la seccion Propiedades" });
    },
    onError: () => { toast({ title: "Error", description: "Error al archivar la certificacion", variant: "destructive" }); },
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: async (certificationId: number) => apiRequest("DELETE", `/api/certifications/${certificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      toast({ title: "Certificacion eliminada", description: "La certificacion ha sido eliminada permanentemente" });
    },
    onError: () => { toast({ title: "Error", description: "Error al eliminar la certificacion", variant: "destructive" }); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ certificationId, status }: { certificationId: number; status: string }) =>
      apiRequest("PATCH", `/api/certifications/${certificationId}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      if (variables.status === "finalizado") {
        archiveCertificationMutation.mutate(variables.certificationId);
      } else {
        toast({ title: "Estado actualizado", description: `El estado ha sido cambiado a ${variables.status}` });
      }
    },
    onError: () => { toast({ title: "Error", description: "Error al actualizar el estado", variant: "destructive" }); },
  });

  const STATUS_OPTIONS = [
    { value: "nuevo",      label: "Nuevo",      dotCls: "bg-blue-500",    pillCls: "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/40"             },
    { value: "en_proceso", label: "En Proceso", dotCls: "bg-orange-500",  pillCls: "bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900/40" },
    { value: "finalizado", label: "Finalizado", dotCls: "bg-emerald-600", pillCls: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/40" },
  ];

  const getStatusSelect = (cert: Certification) => {
    const currentStatus = cert.status || "nuevo";
    const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? STATUS_OPTIONS[0];
    return (
      <div className="relative inline-flex">
        <select
          value={currentStatus}
          onChange={(e) => {
            const newStatus = e.target.value;
            if (newStatus === "finalizado") {
              const ok = confirm("Al marcar como Finalizado, la certificacion se archivara automaticamente. Continuar?");
              if (!ok) return;
            }
            updateStatusMutation.mutate({ certificationId: cert.id, status: newStatus });
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          disabled={updateStatusMutation.isPending}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer select-none border ${currentOption.pillCls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotCls}`} />
          {currentOption.label}
        </span>
      </div>
    );
  };

  const { data: existingShares = [], refetch: refetchShares } = useQuery<any[]>({
    queryKey: ["/api/certifications", sharingCertId, "shares"],
    queryFn: async () => {
      if (!sharingCertId) return [];
      const res = await fetch(`/api/certifications/${sharingCertId}/shares`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: sharingCertId !== null,
  });

  const revokeShareMutation = useMutation({
    mutationFn: async ({ certId, shareId }: { certId: number; shareId: number }) =>
      apiRequest("DELETE", `/api/certifications/${certId}/share/${shareId}`),
    onSuccess: () => {
      refetchShares();
      toast({ title: "Acceso revocado", description: "El técnico ya no tiene acceso a este expediente." });
    },
    onError: () => { toast({ title: "Error", description: "No se pudo revocar el acceso.", variant: "destructive" }); },
  });

  const handleShare = async () => {
    if (!sharingCertId || !shareEmail) return;
    const certIdRef = sharingCertId;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/certifications/${certIdRef}/share`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      toast({
        title: "Acceso compartido",
        description: data.isRegistered
          ? `${shareEmail} ya tiene acceso al expediente.`
          : `Invitación enviada a ${shareEmail}. Tendrá acceso cuando inicie sesión.`,
      });
      setShareEmail("");
      refetchShares();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setShareLoading(false);
    }
  };

  const buildPreviewLinks = (cert: Certification): PreviewLink[] => {
    const links: PreviewLink[] = [];
    const origin = window.location.origin;
    if (cert.presupuestoToken) links.push({ label: "Tarifa / Presupuesto", url: `${origin}/presupuesto/${cert.presupuestoToken}`, icon: <Link2 className="w-3.5 h-3.5" /> });
    if (cert.ceeToken) links.push({ label: "Formulario CEE", url: `${origin}/formulario-cee/${cert.ceeToken}`, icon: <FileCheck className="w-3.5 h-3.5" /> });
    if (cert.solicitudToken) links.push({ label: "Solicitud", url: `${origin}/solicitud/${cert.solicitudToken}`, icon: <FileText className="w-3.5 h-3.5" /> });
    return links;
  };

  const previewLinks = previewCert ? buildPreviewLinks(previewCert) : [];

  return (
    <div className="flex h-screen bg-[#f6f8f7] dark:bg-background">
      <Sidebar selectedTab="certificados" onTabChange={() => {}} />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-7">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-foreground tracking-tight">Visión operacional</h1>
              <p className="text-sm text-emerald-700/60 dark:text-muted-foreground mt-1.5 font-medium">
                Gestiona y realiza el seguimiento de tus certificaciones CEE.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-card rounded-2xl border border-emerald-100/60 dark:border-border shadow-sm px-5 py-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <FileCheck2 size={20} strokeWidth={2.2} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700/60 dark:text-muted-foreground leading-tight">
                  Total certificados
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-foreground tracking-tight leading-none mt-1">{totalCount}</p>
              </div>
            </div>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "mine",   label: "Mis expedientes",    Icon: IdCard },
              { id: "shared", label: "Compartido conmigo", Icon: Users2 },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as "mine" | "shared")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === "shared" && (sharedWithMe as SharedCert[]).length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {(sharedWithMe as SharedCert[]).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Shared with me ─────────────────────────────────────────────── */}
          {activeTab === "shared" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {(sharedWithMe as SharedCert[]).length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Users2 />}
                    title="Sin expedientes compartidos"
                    description="Cuando otro técnico comparta un expediente contigo aparecerá aquí."
                    size="compact"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-emerald-50/40 dark:bg-emerald-950/10">
                        {["Propietario / Dirección", "Calificación", "Estado", "Compartido", "Acceso"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-emerald-700/60 dark:text-muted-foreground uppercase tracking-[0.08em] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sharedWithMe as SharedCert[]).map((s) => (
                        <tr key={s.shareId} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-foreground">{s.ownerName || "—"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.address}{s.city ? `, ${s.city}` : ""}</p>
                          </td>
                          <td className="px-6 py-4">
                            {s.energyRating
                              ? <EnergyChip rating={s.energyRating} />
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-6 py-4"><Badge variant="outline">{s.status}</Badge></td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(s.invitedAt).toLocaleDateString("es-ES")}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                              <UserCheck className="w-3 h-3" />Solo lectura
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Pending payments ───────────────────────────────────────────── */}
          {(pendingPayments as PendingPayment[]).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                    Pagos pendientes de verificacion
                    <span className="text-xs font-bold text-white rounded-full px-1.5 py-0.5 bg-amber-600">
                      {(pendingPayments as PendingPayment[]).length}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clientes que han notificado un pago manual. Confirmalo o rechazalo para avanzar en el flujo.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {(pendingPayments as PendingPayment[]).map((pay) => {
                  const meta = METHOD_LABELS[pay.metodo] ?? { label: pay.metodo, icon: "💳", color: "bg-muted text-muted-foreground border-border" };
                  const isRejectingThis = rejectingId === pay.id;
                  return (
                    <div key={pay.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-sm">{pay.ownerName ?? "Cliente"}</span>
                              <span className={`text-xs border rounded-full px-2 py-0.5 ${meta.color}`}>{meta.label}</span>
                              <span className="text-xs border border-border rounded-full px-2 py-0.5 text-muted-foreground">Tramo {pay.tramo}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{pay.address ?? pay.city ?? "—"}</p>
                            {pay.notas && <p className="text-xs text-muted-foreground mt-1 italic">"{pay.notas}"</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              {pay.fechaNotificacion
                                ? new Date(pay.fechaNotificacion).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-lg font-black text-foreground">{parseFloat(pay.amount).toFixed(2)} EUR</p>
                        </div>
                      </div>
                      {!isRejectingThis ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                            onClick={() => confirmPaymentMutation.mutate(pay.id)} disabled={confirmPaymentMutation.isPending}
                            data-testid={`btn-confirm-payment-${pay.id}`}>
                            <CheckCircle className="w-4 h-4" />Confirmar pago
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => { setRejectingId(pay.id); setRejectMotivo(""); }}
                            data-testid={`btn-reject-payment-${pay.id}`}>
                            <XCircle className="w-4 h-4" />Rechazar
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea value={rejectMotivo} onChange={(e) => setRejectMotivo(e.target.value)}
                            placeholder="Motivo del rechazo (opcional)..." rows={2}
                            className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none text-foreground placeholder:text-muted-foreground" />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setRejectingId(null)}>Cancelar</Button>
                            <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => rejectPaymentMutation.mutate({ id: pay.id, motivo: rejectMotivo })}
                              disabled={rejectPaymentMutation.isPending}
                              data-testid={`btn-confirm-reject-${pay.id}`}>
                              Confirmar rechazo
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Search + filter ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/70 dark:text-muted-foreground w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Buscar por cliente, dirección o referencia catastral…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 h-auto rounded-xl text-sm font-medium bg-card border-emerald-100/80 dark:border-border shadow-sm placeholder:text-emerald-700/40 dark:placeholder:text-muted-foreground focus-visible:ring-emerald-300"
              />
            </div>
            <div className="inline-flex items-center bg-card border border-emerald-100/80 dark:border-border rounded-xl shadow-sm p-1 self-start sm:self-auto flex-shrink-0">
              {[
                { value: "all",        label: "Todos"      },
                { value: "nuevo",      label: "Nuevo"      },
                { value: "en_proceso", label: "En Proceso" },
                { value: "finalizado", label: "Finalizado" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusFilter(value)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    statusFilter === value
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-emerald-700/70 hover:text-emerald-900 hover:bg-emerald-50 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main table card ────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl shadow-sm border border-emerald-100/60 dark:border-border overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 py-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                    <div className="h-6 bg-muted rounded-full w-20" />
                    <div className="h-8 bg-muted rounded-lg w-24" />
                  </div>
                ))}
              </div>
            ) : certList.length === 0 ? (
              <div className="p-8">
                {debouncedSearch || statusFilter !== "all" ? (
                  <EmptyState
                    icon={<Search />}
                    title="Sin resultados"
                    description="Ninguna certificación coincide con los filtros aplicados."
                    action={{ label: "Limpiar filtros", onClick: () => { setDebouncedSearch(""); setStatusFilter("all"); }, variant: "outline" }}
                    size="compact"
                  />
                ) : (
                  <EmptyState
                    icon={<IdCard />}
                    title="Aún no tienes certificaciones"
                    description="Crea tu primera certificación energética y empieza a gestionar tus expedientes desde aquí."
                    action={{ label: "Crear primera certificación", onClick: () => window.location.href = "/certificados/nuevo", icon: <Plus className="w-4 h-4" /> }}
                  />
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-emerald-50/40 dark:bg-emerald-950/10">
                        {["Cliente", "Inmueble", "Fecha", "Estado", "Flujo", "Acciones"].map((h) => (
                          <th
                            key={h}
                            className={`px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700/60 dark:text-muted-foreground whitespace-nowrap${
                              h === "Fecha" ? " hidden md:table-cell" : ""
                            }${h === "Flujo" ? " hidden lg:table-cell" : ""}${h === "Acciones" ? " text-right" : ""}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {certList.map((cert) => {
                        const ini = initials(cert.ownerName || "?");
                        const hasLinks = cert.presupuestoToken || cert.ceeToken || cert.solicitudToken;
                        return (
                          <tr key={cert.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 transition-colors">

                            {/* Cliente */}
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  {ini}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-emerald-900 dark:text-foreground text-sm truncate">{cert.ownerName}</p>
                                  <p className="text-xs text-emerald-700/55 dark:text-muted-foreground mt-0.5 truncate">
                                    {cert.ownerEmail || cert.ownerDni || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Inmueble */}
                            <td className="px-6 py-5">
                              <p className="text-sm text-emerald-900 dark:text-foreground font-medium truncate max-w-[200px]">{cert.propertyAddress}</p>
                              <p className="text-xs text-emerald-700/55 dark:text-muted-foreground mt-0.5 font-mono">{cert.cadastralRef}</p>
                            </td>

                            {/* Fecha */}
                            <td className="px-6 py-5 hidden md:table-cell text-xs font-medium text-emerald-700/70 dark:text-muted-foreground whitespace-nowrap">
                              {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </td>

                            {/* Estado */}
                            <td className="px-6 py-5">{getStatusSelect(cert)}</td>

                            {/* Flujo */}
                            <td className="px-6 py-5 hidden lg:table-cell">
                              <WorkflowBadge status={cert.workflowStatus} />
                            </td>

                            {/* Acciones */}
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {cert.presupuestoToken && (
                                  <button
                                    onClick={() => setPreviewCert(cert)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 rounded-full text-[11px] font-semibold hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span className="hidden sm:inline">Tarifa</span>
                                  </button>
                                )}
                                {cert.ceeToken && (
                                  <button
                                    onClick={() => setPreviewCert(cert)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 rounded-full text-[11px] font-semibold hover:bg-teal-100 dark:hover:bg-teal-950/60 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span className="hidden sm:inline">CEE</span>
                                  </button>
                                )}

                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 rounded-full text-[11px] font-semibold px-3 h-7 shadow-sm"
                                  onClick={() => setWizardCertId(cert.id)}
                                  data-testid={`btn-enviar-cliente-${cert.id}`}
                                >
                                  <Send className="w-3 h-3" />Enviar
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full text-[11px] font-medium px-3 h-7 gap-1 border-border hover:bg-muted/40"
                                  onClick={() => setDetailCertId(cert.id)}
                                  data-testid={`btn-ver-${cert.id}`}
                                >
                                  <Eye className="w-3 h-3" />Ver
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="w-8 h-8 inline-flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-muted rounded-full transition-colors text-emerald-700/60 hover:text-emerald-900 dark:text-muted-foreground dark:hover:text-foreground disabled:opacity-50"
                                      disabled={downloadingId === cert.id}
                                      data-testid={`btn-more-${cert.id}`}
                                    >
                                      <MoreVertical className="w-5 h-5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52">
                                    {cert.tecnicoFormStatus === "completado" && (
                                      <>
                                        <DropdownMenuItem asChild>
                                          <Link to={`/revision-tecnica/${cert.id}`} className="flex items-center gap-2" data-testid={`btn-revision-tecnica-${cert.id}`}>
                                            <ClipboardList className="w-4 h-4 text-primary" />
                                            Revisar datos técnicos
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDownload(cert, "pdf")} disabled={downloadingId === cert.id} data-testid={`btn-pdf-${cert.id}`}>
                                      <FileText className="w-4 h-4 mr-2 text-red-500" />Descargar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(cert, "word")} disabled={downloadingId === cert.id} data-testid={`btn-word-${cert.id}`}>
                                      <File className="w-4 h-4 mr-2 text-blue-500" />Descargar Word
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(cert, "excel")} disabled={downloadingId === cert.id} data-testid={`btn-excel-${cert.id}`}>
                                      <Sheet className="w-4 h-4 mr-2 text-green-600" />Descargar Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportCE3X(cert.id)} disabled={exportingCE3XId === cert.id} data-testid={`btn-ce3x-${cert.id}`}>
                                      <FileCode className="w-4 h-4 mr-2 text-purple-500" />
                                      {exportingCE3XId === cert.id ? "Generando..." : "Exportar CE3X (.xml)"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSharingCertId(cert.id)}>
                                      <Share2 className="w-4 h-4 mr-2 text-primary" />Compartir expediente
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => archiveCertificationMutation.mutate(cert.id)}
                                      disabled={archiveCertificationMutation.isPending}
                                      data-testid={`btn-archivar-${cert.id}`}
                                    >
                                      <Archive className="w-4 h-4 mr-2 text-muted-foreground" />Archivar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (confirm("Estas seguro de que quieres eliminar esta certificacion? Esta accion no se puede deshacer.")) {
                                          deleteCertificationMutation.mutate(cert.id);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700 focus:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Table footer ───────────────────────────────────────── */}
                <div className="px-5 sm:px-6 py-4 bg-emerald-50/30 dark:bg-emerald-950/10 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-emerald-700/60 dark:text-muted-foreground font-medium">
                      Mostrando <span className="font-semibold text-emerald-900 dark:text-foreground">{certList.length}</span> de {totalCount} certificaciones
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="w-7 h-7 p-0 rounded-full"
                          onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === "..." ? (
                              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                            ) : (
                              <Button key={p} variant={page === p ? "default" : "outline"} size="sm"
                                className="w-7 h-7 p-0 rounded-full text-xs" onClick={() => setPage(p as number)}>
                                {p}
                              </Button>
                            )
                          )}
                        <Button variant="outline" size="sm" className="w-7 h-7 p-0 rounded-full"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Link to="/certificados/nuevo">
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-full text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm">
                      <Plus className="w-3.5 h-3.5" />
                      Nueva certificación
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ClientLinkPreviewModal
        open={!!previewCert}
        onClose={() => setPreviewCert(null)}
        links={previewLinks}
        clientName={previewCert?.ownerName || ""}
      />

      {wizardCertId !== null && (
        <ClientFlowWizard certId={wizardCertId} open={wizardCertId !== null} onClose={() => setWizardCertId(null)} />
      )}

      <CertDetailPanel
        certId={detailCertId}
        onClose={() => setDetailCertId(null)}
        onDownload={(certId, format) => {
          const cert = (certData?.data ?? []).find((c: Certification) => c.id === certId);
          if (cert) handleDownload(cert, format);
        }}
        onSend={(certId) => { setDetailCertId(null); setWizardCertId(certId); }}
        onArchive={(certId) => archiveCertificationMutation.mutate(certId)}
      />

      {/* ── Share Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={sharingCertId !== null} onOpenChange={(open) => { if (!open) { setSharingCertId(null); setShareEmail(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Compartir expediente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Introduce el email del técnico colaborador. Tendrá acceso de <strong>solo lectura</strong> a este expediente.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="tecnico@ejemplo.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleShare(); }}
                  className="flex-1"
                  disabled={shareLoading}
                />
                <Button onClick={handleShare} disabled={shareLoading || !shareEmail} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  {shareLoading ? "..." : "Invitar"}
                </Button>
              </div>
            </div>
            {existingShares.length > 0 && (
              <div>
                <Separator className="mb-3" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">Con acceso ahora</p>
                <div className="space-y-2">
                  {existingShares.map((share: any) => (
                    <div key={share.id} className="flex items-center justify-between gap-2 bg-muted/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{share.collaboratorEmail}</p>
                          <p className="text-xs text-muted-foreground">
                            {share.status === "accepted" ? "Acceso activo" : "Invitación pendiente"}{" · "}Solo lectura
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        onClick={() => revokeShareMutation.mutate({ certId: sharingCertId!, shareId: share.id })}
                        disabled={revokeShareMutation.isPending}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {existingShares.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                Aún no has compartido este expediente con nadie.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
