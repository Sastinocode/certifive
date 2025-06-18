import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Mail, 
  MessageCircle, 
  Download, 
  Trash2, 
  FileText,
  CheckCircle2,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UploadedCertificate, Folder } from "@shared/schema";
import CertificateUploadDialog from "./CertificateUploadDialog";

const sendEmailSchema = z.object({
  recipientEmail: z.string().email("Email inválido"),
});

const sendWhatsAppSchema = z.object({
  recipientPhone: z.string().min(1, "Teléfono requerido"),
});

type SendEmailData = z.infer<typeof sendEmailSchema>;
type SendWhatsAppData = z.infer<typeof sendWhatsAppSchema>;

interface CertificateManagementProps {
  folders: Folder[];
  selectedFolderId?: number;
}

export default function CertificateManagement({ 
  folders, 
  selectedFolderId 
}: CertificateManagementProps) {
  const [sendEmailDialog, setSendEmailDialog] = useState<{ open: boolean; certificate: UploadedCertificate | null }>({ open: false, certificate: null });
  const [sendWhatsAppDialog, setSendWhatsAppDialog] = useState<{ open: boolean; certificate: UploadedCertificate | null }>({ open: false, certificate: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["/api/uploaded-certificates", selectedFolderId],
    queryFn: () => apiRequest("GET", `/api/uploaded-certificates${selectedFolderId ? `?folderId=${selectedFolderId}` : ""}`),
  });

  const emailForm = useForm<SendEmailData>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: { recipientEmail: "" },
  });

  const whatsappForm = useForm<SendWhatsAppData>({
    resolver: zodResolver(sendWhatsAppSchema),
    defaultValues: { recipientPhone: "" },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/uploaded-certificates/${id}`),
    onSuccess: () => {
      toast({
        title: "Certificado eliminado",
        description: "El certificado se ha eliminado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-certificates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, email }: { id: number; email: string }) =>
      apiRequest("POST", `/api/uploaded-certificates/${id}/send-email`, { recipientEmail: email }),
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "El certificado se ha enviado por email correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-certificates"] });
      setSendEmailDialog({ open: false, certificate: null });
      emailForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: ({ id, phone }: { id: number; phone: string }) =>
      apiRequest("POST", `/api/uploaded-certificates/${id}/send-whatsapp`, { recipientPhone: phone }),
    onSuccess: () => {
      toast({
        title: "WhatsApp enviado",
        description: "El certificado se ha enviado por WhatsApp correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-certificates"] });
      setSendWhatsAppDialog({ open: false, certificate: null });
      whatsappForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar WhatsApp",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = (data: SendEmailData) => {
    if (sendEmailDialog.certificate) {
      sendEmailMutation.mutate({
        id: sendEmailDialog.certificate.id,
        email: data.recipientEmail,
      });
    }
  };

  const handleSendWhatsApp = (data: SendWhatsAppData) => {
    if (sendWhatsAppDialog.certificate) {
      sendWhatsAppMutation.mutate({
        id: sendWhatsAppDialog.certificate.id,
        phone: data.recipientPhone,
      });
    }
  };

  const handleDownload = (certificate: UploadedCertificate) => {
    // In a real implementation, this would download the file
    toast({
      title: "Descarga iniciada",
      description: `Descargando ${certificate.originalFileName}`,
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificados Subidos</CardTitle>
          <CardDescription>Gestiona los certificados de tus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Certificados Subidos</CardTitle>
              <CardDescription>
                Gestiona los certificados de tus clientes
                {selectedFolderId && (
                  <span className="ml-2 text-primary">
                    - {folders.find(f => f.id === selectedFolderId)?.name}
                  </span>
                )}
              </CardDescription>
            </div>
            <CertificateUploadDialog 
              folders={folders}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/uploaded-certificates"] })}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!certificates?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay certificados subidos</p>
              <p className="text-sm">Sube tu primer certificado para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado de Envío</TableHead>
                  <TableHead>Subido</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate: UploadedCertificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileIcon(certificate.mimeType)}</span>
                        <div>
                          <p className="font-medium text-sm">{certificate.originalFileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(certificate.fileSize)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{certificate.clientName}</p>
                        {certificate.description && (
                          <p className="text-xs text-muted-foreground">{certificate.description}</p>
                        )}
                        {certificate.tags && Array.isArray(certificate.tags) && certificate.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {(certificate.tags as string[]).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {certificate.clientEmail && (
                          <p className="text-muted-foreground">{certificate.clientEmail}</p>
                        )}
                        {certificate.clientPhone && (
                          <p className="text-muted-foreground">{certificate.clientPhone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {certificate.sentViaEmail ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-xs">Email enviado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Pendiente email</span>
                          </div>
                        )}
                        {certificate.sentViaWhatsapp ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-xs">WhatsApp enviado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Pendiente WhatsApp</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {certificate.createdAt ? formatDistanceToNow(new Date(certificate.createdAt), { addSuffix: true, locale: es }) : 'Fecha no disponible'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(certificate)}>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSendEmailDialog({ open: true, certificate });
                              emailForm.setValue("recipientEmail", certificate.clientEmail || "");
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar por Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSendWhatsAppDialog({ open: true, certificate });
                              whatsappForm.setValue("recipientPhone", certificate.clientPhone || "");
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar por WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(certificate.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailDialog.open} onOpenChange={(open) => setSendEmailDialog({ open, certificate: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Certificado por Email</DialogTitle>
          </DialogHeader>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleSendEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email del destinatario</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="cliente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSendEmailDialog({ open: false, certificate: null })}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={sendEmailMutation.isPending}>
                  {sendEmailMutation.isPending ? "Enviando..." : "Enviar Email"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Send WhatsApp Dialog */}
      <Dialog open={sendWhatsAppDialog.open} onOpenChange={(open) => setSendWhatsAppDialog({ open, certificate: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Certificado por WhatsApp</DialogTitle>
          </DialogHeader>
          <Form {...whatsappForm}>
            <form onSubmit={whatsappForm.handleSubmit(handleSendWhatsApp)} className="space-y-4">
              <FormField
                control={whatsappForm.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono del destinatario</FormLabel>
                    <FormControl>
                      <Input placeholder="+34 600 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSendWhatsAppDialog({ open: false, certificate: null })}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={sendWhatsAppMutation.isPending}>
                  {sendWhatsAppMutation.isPending ? "Enviando..." : "Enviar WhatsApp"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}