import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, FileText, CreditCard, AlertTriangle, MessageSquare } from "lucide-react";

export function NotificationTester() {
  const { toast } = useToast();
  
  const createTestNotification = useMutation({
    mutationFn: async (type: string) => 
      apiRequest("POST", "/api/notifications/test", { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      toast({
        title: "Notificación de prueba creada",
        description: "La notificación aparecerá en la campana",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la notificación de prueba",
        variant: "destructive",
      });
    },
  });

  const notificationTypes = [
    {
      type: 'new_certification',
      label: 'Nueva Certificación',
      description: 'Simula una nueva solicitud de certificación',
      icon: FileText,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      type: 'payment_received',
      label: 'Pago Recibido',
      description: 'Simula un pago procesado exitosamente',
      icon: CreditCard,
      color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    },
    {
      type: 'certificate_expiring',
      label: 'Certificado por Vencer',
      description: 'Simula un certificado próximo a vencer',
      icon: AlertTriangle,
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    {
      type: 'quote_request',
      label: 'Solicitud de Presupuesto',
      description: 'Simula una nueva solicitud de presupuesto',
      icon: MessageSquare,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Probador de Notificaciones
        </CardTitle>
        <p className="text-sm text-gray-600">
          Crea notificaciones de prueba para verificar el funcionamiento del sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {notificationTypes.map((notification) => {
            const Icon = notification.icon;
            return (
              <div 
                key={notification.type}
                className={`p-4 rounded-lg border ${notification.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <h3 className="font-medium">{notification.label}</h3>
                      <p className="text-sm opacity-75">{notification.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => createTestNotification.mutate(notification.type)}
                    disabled={createTestNotification.isPending}
                    size="sm"
                    variant="secondary"
                  >
                    {createTestNotification.isPending ? 'Creando...' : 'Probar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Haz clic en "Probar" para crear una notificación de prueba</li>
            <li>2. Observa la campana de notificaciones en la barra superior</li>
            <li>3. Haz clic en la campana para ver las notificaciones</li>
            <li>4. Las notificaciones también se envían por email si está configurado</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}