import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { downloadPDF, downloadWord, downloadExcel } from "@/lib/certDownload";
import ClientFlowWizard from "@/components/ClientFlowWizard";
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
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Wallet,
  Send,
  ClipboardList,
  ChevronLeft,
  ChevronRight
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
  userId: string;
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
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
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
                      ? "bg-teal-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(activeLink?.url)}
            className="flex-shrink-0 gap-1"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(activeLink?.url, "_blank")}
            className="flex-shrink-0 gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe
            key={activeLink?.url}
            src={activeLink?.url}
            className="w-full h-full border-0"
            title={activeLink?.label}
          />
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
  bizum:         { label: "Bizum",         icon: "🟣", color: "bg-violet-100 text-violet-800 border-violet-200" },
  transferencia: { label: "Transferencia", icon: "🏦", color: "bg-blue-100 text-blue-800 border-blue-200" },
  efectivo:      { label: "Efectivo",      icon: "💵", color: "bg-amber-100 text-amber-800 border-amber-200" },
  stripe:        { label: "Tarjeta",       icon: "💳", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [previewCert, setPreviewCert] = useState<Certification | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [wizardCertId, setWizardCertId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

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

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest("POST", `/api/payments/${paymentId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      toast({ title: "Pago confirmado", description: "El pago ha sido verificado y el cliente ha sido notificado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo confirmar el pago.", variant: "destructive" });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      return await apiRequest("POST", `/api/payments/${id}/reject`, { motivo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] });
      setRejectingId(null);
      setRejectMotivo("");
      toast({ title: "Pago rechazado", description: "El pago ha sido marcado como rechazado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo rechazar el pago.", variant: "destructive" });
    },
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
      toast({
        title: "Error al generar el documento",
        description: `No se pudo crear el archivo ${format.toUpperCase()}. Comprueba que la certificacion tiene datos completos.`,
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const archiveCertificationMutation = useMutation({
    mutationFn: async (certificationId: number) => {
      return await apiRequest("POST", `/api/certifications/${certificationId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      toast({ title: "Certificacion archivada", description: "La certificacion se ha movido a la seccion Propiedades" });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al archivar la certificacion", variant: "destructive" });
    },
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: async (certificationId: number) => {
      return await apiRequest("DELETE", `/api/certifications/${certificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      toast({ title: "Certificacion eliminada", description: "La certificacion ha sido eliminada permanentemente" });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al eliminar la certificacion", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ certificationId, status }: { certificationId: number; status: string }) => {
      return await apiRequest("PATCH", `/api/certifications/${certificationId}/status`, { status });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"], exact: false });
      if (variables.status === "finalizado") {
        archiveCertificationMutation.mutate(variables.certificationId);
      } else {
        toast({ title: "Estado actualizado", description: `El estado ha sido cambiado a ${variables.status}` });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Error al actualizar el estado", variant: "destructive" });
    },
  });

  const getStatusSelect = (cert: Certification) => {
    const statusOptions = [
      { value: "nuevo",      label: "Nuevo",      color: "bg-blue-100 text-blue-800" },
      { value: "en_proceso", label: "En Proceso", color: "bg-yellow-100 text-yellow-800" },
      { value: "finalizado", label: "Finalizado", color: "bg-cyan-100 text-cyan-800" },
    ];
    const currentStatus = cert.status || "nuevo";
    const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];
    return (
      <div className="flex items-center">
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
          className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
          disabled={updateStatusMutation.isPending}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Badge className={currentOption.color}>{currentOption.label}</Badge>
      </div>
    );
  };

  const buildPreviewLinks = (cert: Certification): PreviewLink[] => {
    const links: PreviewLink[] = [];
    const origin = window.location.origin;
    if (cert.presupuestoToken) {
      links.push({ label: "Tarifa / Presupuesto", url: `${origin}/presupuesto/${cert.presupuestoToken}`, icon: <Link2 className="w-3.5 h-3.5" /> });
    }
    if (cert.ceeToken) {
      links.push({ label: "Formulario CEE", url: `${origin}/formulario-cee/${cert.ceeToken}`, icon: <FileCheck className="w-3.5 h-3.5" /> });
    }
    if (cert.solicitudToken) {
      links.push({ label: "Solicitud", url: `${origin}/solicitud/${cert.solicitudToken}`, icon: <FileText className="w-3.5 h-3.5" /> });
    }
    return links;
  };

  const previewLinks = previewCert ? buildPreviewLinks(previewCert) : [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab="certificates" onTabChange={() => {}} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Solicitudes de Certificacion</h1>
              <p className="text-muted-foreground mt-1">
                {"Informacion recibida de formularios de clientes — "}{totalCount}{" solicitud"}{totalCount !== 1 ? "es" : ""}
              </p>
            </div>
            <Link to="/certificados/nuevo">
              <Button className="btn-certifive">
                <Plus className="w-4 h-4 mr-2" />
                Procesar Nueva Solicitud
              </Button>
            </Link>
          </div>

          {(pendingPayments as PendingPayment[]).length > 0 && (
            <div className="mb-6">
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle className="text-amber-900 text-base flex items-center gap-2">
                        Pagos pendientes de verificacion
                        <Badge className="bg-amber-600 text-white text-xs">
                          {(pendingPayments as PendingPayment[]).length}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Clientes que han notificado un pago manual. Confirmalo o rechazalo para avanzar en el flujo.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {(pendingPayments as PendingPayment[]).map((pay) => {
                    const meta = METHOD_LABELS[pay.metodo] ?? { label: pay.metodo, icon: "💳", color: "bg-gray-100 text-gray-700 border-gray-200" };
                    const isRejectingThis = rejectingId === pay.id;
                    return (
                      <div key={pay.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{pay.ownerName ?? "Cliente"}</span>
                                <Badge variant="outline" className={`text-xs border ${meta.color}`}>{meta.label}</Badge>
                                <Badge variant="outline" className="text-xs">Tramo {pay.tramo}</Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 truncate">{pay.address ?? pay.city ?? "—"}</p>
                              {pay.notas && <p className="text-xs text-gray-400 mt-1 italic">"{pay.notas}"</p>}
                              <p className="text-xs text-gray-400 mt-1">
                                {pay.fechaNotificacion
                                  ? new Date(pay.fechaNotificacion).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-lg font-black text-gray-900">{parseFloat(pay.amount).toFixed(2)} EUR</p>
                          </div>
                        </div>

                        {!isRejectingThis ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-teal-700 hover:bg-teal-600 text-white gap-1.5"
                              onClick={() => confirmPaymentMutation.mutate(pay.id)}
                              disabled={confirmPaymentMutation.isPending}
                              data-testid={`btn-confirm-payment-${pay.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirmar pago
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => { setRejectingId(pay.id); setRejectMotivo(""); }}
                              data-testid={`btn-reject-payment-${pay.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              value={rejectMotivo}
                              onChange={e => setRejectMotivo(e.target.value)}
                              placeholder="Motivo del rechazo (opcional)..."
                              rows={2}
                              className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none text-foreground placeholder:text-muted-foreground"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => setRejectingId(null)}>
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => rejectPaymentMutation.mutate({ id: pay.id, motivo: rejectMotivo })}
                                disabled={rejectPaymentMutation.isPending}
                                data-testid={`btn-confirm-reject-${pay.id}`}
                              >
                                Confirmar rechazo
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o referencia catastral..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === "all"       ? "default" : "outline"} onClick={() => handleStatusFilter("all")}       size="sm">Todos</Button>
              <Button variant={statusFilter === "draft"     ? "default" : "outline"} onClick={() => handleStatusFilter("draft")}     size="sm">Borradores</Button>
              <Button variant={statusFilter === "pending"   ? "default" : "outline"} onClick={() => handleStatusFilter("pending")}   size="sm">Pendientes</Button>
              <Button variant={statusFilter === "completed" ? "default" : "outline"} onClick={() => handleStatusFilter("completed")} size="sm">Completados</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Certificados ({totalCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 py-3 px-2 border-b border-border">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-6 bg-muted rounded w-20" />
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-8 bg-muted rounded w-24" />
                      <div className="h-8 bg-muted rounded w-32" />
                    </div>
                  ))}
                </div>
              ) : certList.length === 0 ? (
                <div className="text-center py-12">
                  <IdCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {debouncedSearch || statusFilter !== "all" ? "No se encontraron certificaciones" : "No hay certificados aun"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {debouncedSearch || statusFilter !== "all"
                      ? "Intenta ajustar los filtros de busqueda"
                      : "Comienza creando tu primera certificacion energetica"}
                  </p>
                  {!debouncedSearch && statusFilter === "all" && (
                    <Link to="/certificados/nuevo">
                      <Button className="btn-certifive">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primer certificado
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Propietario</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Referencia Catastral</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Enlaces cliente</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certList.map((cert) => {
                        const hasLinks = cert.presupuestoToken || cert.ceeToken || cert.solicitudToken;
                        return (
                          <tr key={cert.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-medium text-foreground">{cert.ownerName}</div>
                              <div className="text-sm text-muted-foreground">{cert.ownerDni}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">{cert.cadastralRef}</span>
                            </td>
                            <td className="py-4 px-4">{getStatusSelect(cert)}</td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">
                                {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES") : "N/A"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {hasLinks ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewCert(cert)}
                                  className="gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                                  data-testid={`btn-preview-links-${cert.id}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Ver enlaces
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Sin enlaces</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                {cert.tecnicoFormStatus === "completado" && (
                                  <Link to={`/revision-tecnica/${cert.id}`}>
                                    <Button
                                      size="sm"
                                      className="bg-emerald-700 hover:bg-emerald-600 text-white gap-1.5"
                                      data-testid={`btn-revision-tecnica-${cert.id}`}
                                    >
                                      <ClipboardList className="w-3.5 h-3.5" />
                                      Revisar datos
                                    </Button>
                                  </Link>
                                )}

                                <Button
                                  size="sm"
                                  className="bg-teal-700 hover:bg-teal-600 text-white gap-1.5"
                                  onClick={() => setWizardCertId(cert.id)}
                                  data-testid={`btn-enviar-cliente-${cert.id}`}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Enviar
                                </Button>

                                <Link to={`/certificacion-request/${cert.id}`}>
                                  <Button variant="outline" size="sm" data-testid={`btn-ver-${cert.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver
                                  </Button>
                                </Link>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={downloadingId === cert.id}
                                      data-testid={`btn-descargar-${cert.id}`}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      {downloadingId === cert.id ? "Generando..." : "Descargar"}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(cert, "pdf")}
                                      disabled={downloadingId === cert.id}
                                      data-testid={`btn-pdf-${cert.id}`}
                                    >
                                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                                      Descargar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(cert, "word")}
                                      disabled={downloadingId === cert.id}
                                      data-testid={`btn-word-${cert.id}`}
                                    >
                                      <File className="w-4 h-4 mr-2 text-blue-500" />
                                      Descargar Word
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(cert, "excel")}
                                      disabled={downloadingId === cert.id}
                                      data-testid={`btn-excel-${cert.id}`}
                                    >
                                      <Sheet className="w-4 h-4 mr-2 text-green-600" />
                                      Descargar Excel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => archiveCertificationMutation.mutate(cert.id)}
                                  disabled={archiveCertificationMutation.isPending}
                                  data-testid={`btn-archivar-${cert.id}`}
                                >
                                  <Archive className="w-4 h-4 mr-1" />
                                  Archivar
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" data-testid={`btn-more-${cert.id}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (confirm("Estas seguro de que quieres eliminar esta certificacion? Esta accion no se puede deshacer.")) {
                                          deleteCertificationMutation.mutate(cert.id);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Eliminar
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

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        {"Pagina "}{page}{" de "}{totalPages}{" · "}{totalCount}{" resultados"}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === "..." ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                            ) : (
                              <Button
                                key={p}
                                variant={page === p ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setPage(p as number)}
                              >
                                {p}
                              </Button>
                            )
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <ClientLinkPreviewModal
        open={!!previewCert}
        onClose={() => setPreviewCert(null)}
        links={previewLinks}
        clientName={previewCert?.ownerName || ""}
      />

      {wizardCertId !== null && (
        <ClientFlowWizard
          certId={wizardCertId}
          open={wizardCertId !== null}
          onClose={() => setWizardCertId(null)}
        />
      )}
    </div>
  );
}
