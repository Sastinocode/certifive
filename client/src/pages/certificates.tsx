import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
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
  Send
} from "lucide-react";

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
              Enlaces de cliente — {clientName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tab selector */}
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

        {/* URL bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 font-mono truncate">
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

        {/* iFrame preview */}
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
  bizum:         { label: "Bizum",               icon: "🟣", color: "bg-violet-100 text-violet-800 border-violet-200" },
  transferencia: { label: "Transferencia",        icon: "🏦", color: "bg-blue-100 text-blue-800 border-blue-200" },
  efectivo:      { label: "Efectivo",             icon: "💵", color: "bg-amber-100 text-amber-800 border-amber-200" },
  stripe:        { label: "Tarjeta",              icon: "💳", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewCert, setPreviewCert] = useState<Certification | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [wizardCertId, setWizardCertId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications"],
  });

  const { data: pendingPayments = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/payments/pending"],
    refetchInterval: 30000,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest("POST", `/api/payments/${paymentId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
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

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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
        description: `No se pudo crear el archivo ${format.toUpperCase()}. Comprueba que la certificación tiene datos completos.`,
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
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Certificación archivada",
        description: "La certificación se ha movido a la sección Propiedades",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al archivar la certificación",
        variant: "destructive",
      });
    },
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: async (certificationId: number) => {
      return await apiRequest("DELETE", `/api/certifications/${certificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Certificación eliminada",
        description: "La certificación ha sido eliminada permanentemente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar la certificación",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ certificationId, status }: { certificationId: number; status: string }) => {
      return await apiRequest("PATCH", `/api/certifications/${certificationId}/status`, { status });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      
      if (variables.status === "finalizado") {
        archiveCertificationMutation.mutate(variables.certificationId);
      } else {
        toast({
          title: "Estado actualizado",
          description: `El estado ha sido cambiado a ${variables.status}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const getStatusSelect = (cert: Certification) => {
    const statusOptions = [
      { value: "nuevo", label: "Nuevo", color: "bg-blue-100 text-blue-800" },
      { value: "en_proceso", label: "En Proceso", color: "bg-yellow-100 text-yellow-800" },
      { value: "finalizado", label: "Finalizado", color: "bg-cyan-100 text-cyan-800" }
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
              const confirmFinalize = confirm(
                "Al marcar como 'Finalizado', la certificación se archivará automáticamente. ¿Continuar?"
              );
              if (!confirmFinalize) return;
            }
            updateStatusMutation.mutate({ certificationId: cert.id, status: newStatus });
          }}
          className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
          disabled={updateStatusMutation.isPending}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Badge className={currentOption.color}>
          {currentOption.label}
        </Badge>
      </div>
    );
  };

  const buildPreviewLinks = (cert: Certification): PreviewLink[] => {
    const links: PreviewLink[] = [];
    const origin = window.location.origin;

    if (cert.presupuestoToken) {
      links.push({
        label: "Tarifa / Presupuesto",
        url: `${origin}/presupuesto/${cert.presupuestoToken}`,
        icon: <Link2 className="w-3.5 h-3.5" />,
      });
    }
    if (cert.ceeToken) {
      links.push({
        label: "Formulario CEE",
        url: `${origin}/formulario-cee/${cert.ceeToken}`,
        icon: <FileCheck className="w-3.5 h-3.5" />,
      });
    }
    if (cert.solicitudToken) {
      links.push({
        label: "Solicitud",
        url: `${origin}/solicitud/${cert.solicitudToken}`,
        icon: <FileText className="w-3.5 h-3.5" />,
      });
    }
    return links;
  };

  const filteredCertifications = (certifications as Certification[]).filter((cert: Certification) => {
    const matchesSearch = (cert.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cert.cadastralRef || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const previewLinks = previewCert ? buildPreviewLinks(previewCert) : [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="certificates" onTabChange={() => {}} />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Certificación</h1>
              <p className="text-gray-600 mt-1">
                Información recibida de formularios de clientes - {filteredCertifications.length} solicitud{filteredCertifications.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <Link to="/certificados/nuevo">
              <Button className="btn-certifive">
                <Plus className="w-4 h-4 mr-2" />
                Procesar Nueva Solicitud
              </Button>
            </Link>
          </div>

          {/* Pending Payments Panel */}
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
                        Pagos pendientes de verificación
                        <Badge className="bg-amber-600 text-white text-xs">
                          {(pendingPayments as PendingPayment[]).length}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Clientes que han notificado un pago manual. Confírmalo o recházalo para avanzar en el flujo.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {(pendingPayments as PendingPayment[]).map((pay) => {
                    const meta = METHOD_LABELS[pay.metodo] ?? { label: pay.metodo, icon: "💳", color: "bg-gray-100 text-gray-700 border-gray-200" };
                    const isRejectingThis = rejectingId === pay.id;
                    return (
                      <div key={pay.id} className="bg-white rounded-2xl border border-amber-100 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{pay.ownerName ?? "Cliente"}</span>
                                <Badge variant="outline" className={`text-xs border ${meta.color}`}>
                                  {meta.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Tramo {pay.tramo}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 truncate">
                                {pay.address ?? pay.city ?? "—"}
                              </p>
                              {pay.notas && (
                                <p className="text-xs text-gray-400 mt-1 italic">"{pay.notas}"</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {pay.fechaNotificacion ? new Date(pay.fechaNotificacion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-lg font-black text-gray-900">{parseFloat(pay.amount).toFixed(2)} €</p>
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
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setRejectingId(null)}
                              >
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

          {/* Search and Filters */}
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
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => setStatusFilter("draft")}
                size="sm"
              >
                Borradores
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
              >
                Pendientes
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
              >
                Completados
              </Button>
            </div>
          </div>

          {/* Certifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Certificados ({filteredCertifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando certificaciones...</p>
                </div>
              ) : filteredCertifications.length === 0 ? (
                <div className="text-center py-12">
                  <IdCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== "all" 
                      ? "No se encontraron certificaciones" 
                      : "No hay certificados aún"
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Comienza creando tu primera certificación energética"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
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
                      {filteredCertifications.map((cert) => {
                        const typedCert = cert as Certification;
                        const hasLinks = typedCert.presupuestoToken || typedCert.ceeToken || typedCert.solicitudToken;
                        return (
                          <tr key={typedCert.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">{typedCert.ownerName}</div>
                              <div className="text-sm text-gray-500">{typedCert.ownerDni}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">{typedCert.cadastralRef}</span>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusSelect(typedCert)}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">
                                {typedCert.createdAt ? new Date(typedCert.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {hasLinks ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewCert(typedCert)}
                                  className="gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                                  data-testid={`btn-preview-links-${typedCert.id}`}
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
                                {/* Enviar a cliente — primary CTA */}
                                <Button
                                  size="sm"
                                  className="bg-teal-700 hover:bg-teal-600 text-white gap-1.5"
                                  onClick={() => setWizardCertId(typedCert.id)}
                                  data-testid={`btn-enviar-cliente-${typedCert.id}`}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Enviar
                                </Button>

                                <Link to={`/certificacion-request/${typedCert.id}`}>
                                  <Button variant="outline" size="sm" data-testid={`btn-ver-${typedCert.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver
                                  </Button>
                                </Link>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={downloadingId === typedCert.id}
                                      data-testid={`btn-descargar-${typedCert.id}`}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      {downloadingId === typedCert.id ? "Generando..." : "Descargar"}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(typedCert, "pdf")}
                                      disabled={downloadingId === typedCert.id}
                                      data-testid={`btn-pdf-${typedCert.id}`}
                                    >
                                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                                      Descargar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(typedCert, "word")}
                                      disabled={downloadingId === typedCert.id}
                                      data-testid={`btn-word-${typedCert.id}`}
                                    >
                                      <File className="w-4 h-4 mr-2 text-blue-500" />
                                      Descargar Word
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(typedCert, "excel")}
                                      disabled={downloadingId === typedCert.id}
                                      data-testid={`btn-excel-${typedCert.id}`}
                                    >
                                      <Sheet className="w-4 h-4 mr-2 text-green-600" />
                                      Descargar Excel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => archiveCertificationMutation.mutate(typedCert.id)}
                                  disabled={archiveCertificationMutation.isPending}
                                  data-testid={`btn-archivar-${typedCert.id}`}
                                >
                                  <Archive className="w-4 h-4 mr-1" />
                                  Archivar
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" data-testid={`btn-more-${typedCert.id}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (confirm('¿Estás seguro de que quieres eliminar esta certificación? Esta acción no se puede deshacer.')) {
                                          deleteCertificationMutation.mutate(typedCert.id);
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Client Link Preview Modal */}
      <ClientLinkPreviewModal
        open={!!previewCert}
        onClose={() => setPreviewCert(null)}
        links={previewLinks}
        clientName={previewCert?.ownerName || ""}
      />

      {/* Client Flow Wizard */}
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
