import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle, Settings } from "lucide-react";

export function NotificationStatus() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const hasEmailConfigured = user?.email;
  const sendGridConfigured = false; // Will be true when SendGrid is configured

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Sistema de Notificaciones</h3>
              <p className="text-sm text-gray-600">
                {hasEmailConfigured 
                  ? `Vinculado a: ${user.email}`
                  : "Email no configurado"
                }
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              {hasEmailConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600" />
              )}
              <Badge 
                variant={hasEmailConfigured ? "default" : "secondary"}
                className={hasEmailConfigured ? "bg-green-100 text-green-800" : ""}
              >
                {hasEmailConfigured ? "Email Vinculado" : "Email Pendiente"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {sendGridConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Settings className="w-4 h-4 text-gray-400" />
              )}
              <Badge variant="outline" className="text-xs">
                {sendGridConfigured ? "SendGrid Activo" : "SendGrid Pendiente"}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Estado del Sistema:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${hasEmailConfigured ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span>Notificaciones visuales en dashboard</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${hasEmailConfigured ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span>Email del certificador vinculado</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${sendGridConfigured ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>Envío automático por correo</span>
            </li>
          </ul>
          
          {hasEmailConfigured && !sendGridConfigured && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="text-blue-800">
                <strong>Listo para activar:</strong> Las notificaciones se enviarán automáticamente 
                a tu correo cuando configures SendGrid en el futuro.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}