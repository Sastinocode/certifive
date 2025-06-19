import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { NotificationStatus } from "@/components/notifications/NotificationStatus";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  FileText, 
  Save,
  Building,
  Mail,
  Phone,
  Database,
  Download,
  Calendar,
  HardDrive
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    company: "",
    license: "",
    address: ""
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailCertifications: true,
    emailReports: true,
    emailReminders: false,
    pushNotifications: true,
    smsAlerts: false
  });

  // Certificate settings
  const [certificateSettings, setCertificateSettings] = useState({
    defaultValidity: "10",
    autoBackup: true
  });

  // Backup status
  const [backupStatus, setBackupStatus] = useState({
    enabled: false,
    lastBackup: null,
    backupCount: 0,
    totalSize: 0
  });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const handleProfileSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Perfil actualizado",
      description: "Los cambios han sido guardados correctamente.",
    });
    setIsSaving(false);
  };

  const handleNotificationsSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Preferencias actualizadas",
      description: "La configuración de notificaciones ha sido guardada.",
    });
    setIsSaving(false);
  };

  const handleCertificateSettingsSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateSettings),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      const result = await response.json();
      
      toast({
        title: "Configuración actualizada",
        description: certificateSettings.autoBackup 
          ? "Configuración guardada y backup automático creado"
          : "Los ajustes predeterminados han sido guardados",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  // Load backup status on component mount
  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    try {
      const response = await fetch('/api/backup/status');
      if (response.ok) {
        const status = await response.json();
        setBackupStatus(status);
      }
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al crear backup');
      }

      const result = await response.json();
      
      toast({
        title: "Backup creado",
        description: "Copia de seguridad creada exitosamente",
      });

      // Reload backup status
      await loadBackupStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el backup",
        variant: "destructive",
      });
    }
    setIsCreatingBackup(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="settings" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Configuración</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h2>
            <p className="text-gray-600">Gestiona tu perfil, notificaciones y preferencias de certificación</p>
          </div>

          <div className="max-w-4xl space-y-8">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <User className="w-5 h-5 text-primary mr-2" />
                  <CardTitle>Perfil Profesional</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Tu nombre"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Tus apellidos"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                        placeholder="968 123 456"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        className="pl-10"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="license">Número de Colegiado</Label>
                    <Input
                      id="license"
                      value={profileData.license}
                      onChange={(e) => setProfileData(prev => ({ ...prev, license: e.target.value }))}
                      placeholder="Ej: COA-1234"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Dirección Profesional</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Dirección completa de tu actividad profesional"
                    rows={3}
                  />
                </div>

                <Button onClick={handleProfileSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-primary mr-2" />
                  <CardTitle>Notificaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification System Status */}
                <div className="mb-6">
                  <NotificationStatus />
                </div>

                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Certificaciones completadas por email</Label>
                      <p className="text-sm text-gray-500">Recibe confirmación cuando se complete una certificación</p>
                    </div>
                    <Switch
                      checked={notifications.emailCertifications}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailCertifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Informes mensuales por email</Label>
                      <p className="text-sm text-gray-500">Resumen mensual de actividad y estadísticas</p>
                    </div>
                    <Switch
                      checked={notifications.emailReports}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailReports: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Recordatorios de vencimiento</Label>
                      <p className="text-sm text-gray-500">Alertas sobre certificados próximos a vencer</p>
                    </div>
                    <Switch
                      checked={notifications.emailReminders}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailReminders: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Notificaciones push</Label>
                      <p className="text-sm text-gray-500">Notificaciones en tiempo real en el navegador</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Alertas SMS (próximamente)</Label>
                      <p className="text-sm text-gray-500">Notificaciones importantes por mensaje de texto</p>
                    </div>
                    <Switch
                      checked={notifications.smsAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, smsAlerts: checked }))
                      }
                      disabled
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationsSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Guardando..." : "Guardar Preferencias"}
                </Button>
              </CardContent>
            </Card>

            {/* Certificate Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-primary mr-2" />
                  <CardTitle>Configuración de Certificados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="validity">Validez predeterminada (años)</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Duración estándar para nuevos certificados energéticos
                    </p>
                    <Select
                      value={certificateSettings.defaultValidity}
                      onValueChange={(value) => 
                        setCertificateSettings(prev => ({ ...prev, defaultValidity: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 año</SelectItem>
                        <SelectItem value="2">2 años</SelectItem>
                        <SelectItem value="3">3 años</SelectItem>
                        <SelectItem value="5">5 años</SelectItem>
                        <SelectItem value="7">7 años</SelectItem>
                        <SelectItem value="10">10 años</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Backup automático</Label>
                      <p className="text-sm text-gray-500">
                        Crear copias de seguridad automáticas de certificados y documentos
                      </p>
                    </div>
                    <Switch
                      checked={certificateSettings.autoBackup}
                      onCheckedChange={(checked) => 
                        setCertificateSettings(prev => ({ ...prev, autoBackup: checked }))
                      }
                    />
                  </div>

                  {certificateSettings.autoBackup && (
                    <div className="ml-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Sistema de backup activo</span>
                      </div>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• Backup diario automático a las 02:00 AM</li>
                        <li>• Respaldo de certificados finalizados</li>
                        <li>• Copia de documentos adjuntos</li>
                        <li>• Retención de 30 días de historial</li>
                        <li>• Compresión automática para optimizar espacio</li>
                      </ul>
                    </div>
                  )}
                </div>

                <Button onClick={handleCertificateSettingsSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-primary mr-2" />
                  <CardTitle>Seguridad</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Autenticación de dos factores</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Añade una capa extra de seguridad a tu cuenta
                    </p>
                    <Button variant="outline" disabled>
                      Configurar 2FA (Próximamente)
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Sesiones activas</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Gestiona los dispositivos conectados a tu cuenta
                    </p>
                    <Button variant="outline">
                      Ver Sesiones Activas
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Exportar datos</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Descarga una copia de todos tus datos
                    </p>
                    <Button variant="outline">
                      Solicitar Exportación
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}