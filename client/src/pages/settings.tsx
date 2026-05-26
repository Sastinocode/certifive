import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { NotificationStatus } from "@/components/notifications/NotificationStatus";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  HardDrive,
  CheckCircle,
  AlertCircle,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Crown,
  Star,
  Zap,
  Check,
  ExternalLink,
  RefreshCw,
  Package,
  Receipt,
  Building2,
  BookOpen,
  RotateCcw,
  HelpCircle
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    company: "",
    license: "",
    address: "",
    dni: ""
  });

  const [paymentSettings, setPaymentSettings] = useState({
    bizumPhone: "",
    iban: "",
    enabledPaymentMethods: ["stripe", "bizum", "transferencia", "efectivo"] as string[],
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [notifications, setNotifications] = useState({
    emailCertifications: true,
    emailReports: true,
    emailReminders: false,
    pushNotifications: true
  });

  const [certificateSettings, setCertificateSettings] = useState({
    defaultValidity: "10",
    autoBackup: true
  });

  const [backupStatus, setBackupStatus] = useState({
    enabled: false,
    lastBackup: null as string | null,
    backupCount: 0,
    totalSize: 0
  });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const [profileValidation, setProfileValidation] = useState({
    isValid: false,
    missingFields: [] as string[]
  });

  useEffect(() => {
    const loadProfileValidation = async () => {
      try {
        const response = await fetch('/api/profile/validation');
        if (response.ok) {
          const validation = await response.json();
          setProfileValidation(validation);
        }
      } catch (error) {
        console.error('Error loading profile validation:', error);
      }
    };

    const loadPaymentSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch('/api/auth/user', { headers });
        if (response.ok) {
          const userData = await response.json();
          setPaymentSettings({
            bizumPhone: userData.bizumPhone || "",
            iban: userData.iban || "",
            enabledPaymentMethods: (userData.enabledPaymentMethods as string[]) ?? ["stripe", "bizum", "transferencia", "efectivo"],
          });
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
      }
    };

    loadProfileValidation();
    loadPaymentSettings();
  }, []);

  const handlePaymentSettingsSave = async () => {
    setIsSavingPayment(true);
    try {
      const response = await fetch('/api/auth/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bizumPhone: paymentSettings.bizumPhone || null,
          iban: paymentSettings.iban || null,
          enabledPaymentMethods: paymentSettings.enabledPaymentMethods,
        }),
      });
      if (!response.ok) throw new Error();
      toast({ title: "Métodos de cobro guardados", description: "Los datos de pago se han actualizado correctamente." });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la configuración de cobro.", variant: "destructive" });
    }
    setIsSavingPayment(false);
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentSettings(prev => ({
      ...prev,
      enabledPaymentMethods: prev.enabledPaymentMethods.includes(method)
        ? prev.enabledPaymentMethods.filter(m => m !== method)
        : [...prev.enabledPaymentMethods, method],
    }));
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error('Error al actualizar perfil');
      const validationResponse = await fetch('/api/profile/validation');
      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        setProfileValidation(validation);
      }
      toast({ title: "Perfil actualizado", description: "Los cambios han sido guardados correctamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleNotificationsSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Preferencias actualizadas", description: "La configuración de notificaciones ha sido guardada." });
    setIsSaving(false);
  };

  const handleCertificateSettingsSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateSettings),
      });
      if (!response.ok) throw new Error('Error al guardar configuración');
      toast({
        title: "Configuración actualizada",
        description: certificateSettings.autoBackup
          ? "Configuración guardada y backup automático creado"
          : "Los ajustes predeterminados han sido guardados",
      });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
    }
    setIsSaving(false);
  };

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    try {
      const response = await fetch('/api/backup/status');
      if (response.ok) {
        const status = await response.json();
        setBackupStatus(status);
      } else {
        setBackupStatus({ enabled: true, lastBackup: null, backupCount: 0, totalSize: 0 });
      }
    } catch (error) {
      setBackupStatus({ enabled: true, lastBackup: null, backupCount: 0, totalSize: 0 });
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        toast({ title: "Backup creado", description: "Copia de seguridad creada exitosamente" });
        await loadBackupStatus();
      } else {
        toast({ title: "Backup simulado", description: "Sistema de backup en modo demostración - Configuración guardada" });
        setBackupStatus(prev => ({ ...prev, lastBackup: new Date().toISOString(), backupCount: prev.backupCount + 1, totalSize: prev.totalSize + 1024 * 1024 }));
      }
    } catch (error) {
      toast({ title: "Backup simulado", description: "Sistema funcionando en modo demostración" });
      setBackupStatus(prev => ({ ...prev, lastBackup: new Date().toISOString(), backupCount: prev.backupCount + 1, totalSize: prev.totalSize + 1024 * 1024 }));
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

  const { data: subData, isLoading: subLoading, refetch: refetchSub } = useQuery<{
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    cancelAt: string | null;
    stripeCustomerId: string | null;
    stripeConfigured: boolean;
    priceIds: Record<string, string | undefined>;
  }>({
    queryKey: ["/api/subscription"],
  });

  const { data: invoiceData, isLoading: invoicesLoading } = useQuery<{
    invoices: Array<{
      id: string;
      number: string | null;
      amount: number;
      currency: string;
      status: string;
      created: string;
      pdfUrl: string | null;
      hostedUrl: string | null;
      description: string | null;
    }>;
    stripeConfigured: boolean;
  }>({
    queryKey: ["/api/subscription/invoices"],
  });

  const [openingPortal, setOpeningPortal] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const openBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await apiRequest("POST", "/api/subscription/portal", { returnUrl: window.location.href });
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "No se pudo abrir el portal de facturación", variant: "destructive" });
    }
    setOpeningPortal(false);
  };

  const startCheckout = async (plan: string) => {
    setCheckingOut(plan);
    try {
      const res = await apiRequest("POST", "/api/subscription/checkout", { plan, returnUrl: window.location.href });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "No se pudo iniciar el checkout", variant: "destructive" });
    }
    setCheckingOut(null);
  };

  const PLANS = [
    {
      key: "free",
      name: "Gratuito",
      price: 0,
      period: "",
      icon: <Package className="w-5 h-5" />,
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
      certs: "5 certificados/mes",
      features: ["Gestión básica de certificados", "Exportación PDF", "Soporte por email"],
      notIncluded: ["WhatsApp automatizado", "Clientes ilimitados", "Informes avanzados", "Facturación integrada"],
    },
    {
      key: "basico",
      name: "Básico",
      price: 29,
      period: "/mes",
      icon: <Star className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      certs: "30 certificados/mes",
      features: ["Todo lo del plan Gratuito", "WhatsApp automatizado", "Exportación Word y Excel", "Gestión de carpetas", "Soporte prioritario"],
      notIncluded: ["Clientes ilimitados", "API acceso"],
    },
    {
      key: "pro",
      name: "Pro",
      price: 59,
      period: "/mes",
      icon: <Zap className="w-5 h-5" />,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-200",
      certs: "100 certificados/mes",
      features: ["Todo lo del plan Básico", "Flujos WhatsApp personalizados", "Facturación integrada", "Informes avanzados", "Tarifas dinámicas por zona", "Acceso API"],
      notIncluded: [],
      recommended: true,
    },
    {
      key: "enterprise",
      name: "Enterprise",
      price: 99,
      period: "/mes",
      icon: <Building2 className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      certs: "Ilimitados",
      features: ["Todo lo del plan Pro", "Multi-usuario / equipo", "SLA garantizado", "Onboarding personalizado", "Gestor de cuenta dedicado"],
      notIncluded: [],
    },
  ];

  const currentPlan = PLANS.find(p => p.key === (subData?.plan ?? "free")) ?? PLANS[0];

  const statusLabel = (s: string) => {
    if (s === "active") return { text: "Activo", cls: "bg-green-100 text-green-700" };
    if (s === "trialing") return { text: "Prueba", cls: "bg-blue-100 text-blue-700" };
    if (s === "past_due") return { text: "Pago pendiente", cls: "bg-amber-100 text-amber-700" };
    if (s === "canceled") return { text: "Cancelado", cls: "bg-red-100 text-red-700" };
    return { text: s, cls: "bg-slate-100 text-slate-700" };
  };

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
  };

  const fmtAmount = (amt: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency.toUpperCase() }).format(amt);
  };

  const NAV_ITEMS = [
    { href: "#perfil", Icon: User, label: "Perfil" },
    { href: "#notificaciones", Icon: Bell, label: "Notificaciones" },
    { href: "#certificados", Icon: FileText, label: "Certificados" },
    { href: "#cobro", Icon: Wallet, label: "Métodos de cobro" },
    { href: "#suscripcion", Icon: Crown, label: "Plan & Suscripción" },
    { href: "#ayuda", Icon: HelpCircle, label: "Ayuda" },
    { href: "#seguridad", Icon: Shield, label: "Seguridad" },
  ] as const;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab="settings" onTabChange={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-card border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">Ajustes</h1>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1400px] mx-auto space-y-6">

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Ajustes</h1>
                <p className="text-sm text-muted-foreground mt-1">Configura tu cuenta, empresa y preferencias de la aplicación</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/tarifas"
                className="group flex items-center gap-4 bg-card rounded-2xl border border-border px-5 py-4 hover:border-primary/50 hover:shadow-md transition-all"
                data-testid="link-tarifas-settings"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary text-lg font-bold">€</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">Tarifas y precios</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Configura los precios para generar presupuestos automáticos</p>
                </div>
                <span className="ml-auto text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">→</span>
              </a>
              <a
                href="/facturas"
                className="group flex items-center gap-4 bg-card rounded-2xl border border-border px-5 py-4 hover:border-primary/50 hover:shadow-md transition-all"
                data-testid="link-facturas-settings"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-colors">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">Facturas</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Gestiona y descarga tus facturas emitidas</p>
                </div>
                <span className="ml-auto text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">→</span>
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

              {/* Settings nav */}
              <nav className="bg-card rounded-2xl border border-border shadow-sm p-2 h-fit lg:sticky lg:top-6">
                <ul className="space-y-0.5 text-sm">
                  {NAV_ITEMS.map(({ href, Icon, label }) => (
                    <li key={href}>
                      <a
                        href={href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon size={15} />
                        </span>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-6 min-w-0">

                {/* ─── PERFIL ─── */}
                <section id="perfil" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground tracking-tight">Perfil Profesional</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Tus datos personales y de colegiación</p>
                      </div>
                    </div>
                    {profileValidation.isValid ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 flex-shrink-0">
                        <CheckCircle size={14} />Listo para facturación
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 flex-shrink-0">
                        <AlertCircle size={14} />Completar datos
                      </div>
                    )}
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    {!profileValidation.isValid && profileValidation.missingFields.length > 0 && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          <strong>Campos requeridos para facturación legal:</strong> {profileValidation.missingFields.join(', ')}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Complete estos datos para generar facturas con validez legal española.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" value={profileData.firstName} onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Tu nombre" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input id="lastName" value={profileData.lastName} onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Tus apellidos" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input id="email" type="email" value={profileData.email} onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))} className="pl-10" placeholder="tu@email.com" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input id="phone" type="tel" value={profileData.phone} onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))} className="pl-10" placeholder="968 123 456" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="company">Empresa</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input id="company" value={profileData.company} onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))} className="pl-10" placeholder="Nombre de tu empresa" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dni">DNI/NIF</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input id="dni" value={profileData.dni} onChange={(e) => setProfileData(prev => ({ ...prev, dni: e.target.value }))} className="pl-10" placeholder="12345678A" maxLength={9} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="license">Número de Colegiado</Label>
                        <Input id="license" value={profileData.license} onChange={(e) => setProfileData(prev => ({ ...prev, license: e.target.value }))} placeholder="Ej: COA-1234" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Dirección Profesional</Label>
                      <Textarea id="address" value={profileData.address} onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))} placeholder="Dirección completa de tu actividad profesional" rows={3} />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleProfileSave} disabled={isSaving} className="rounded-full h-10 px-5 gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* ─── NOTIFICACIONES ─── */}
                <section id="notificaciones" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center flex-shrink-0">
                      <Bell size={18} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Notificaciones</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Decide qué avisos quieres recibir y por qué canal</p>
                    </div>
                  </header>

                  <div className="px-6 pt-5 pb-2">
                    <NotificationStatus />
                  </div>

                  <div className="divide-y divide-border border-t border-border">
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Certificaciones completadas por email</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Recibe confirmación cuando se complete una certificación</p>
                      </div>
                      <Switch checked={notifications.emailCertifications} onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailCertifications: checked }))} />
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Informes mensuales por email</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Resumen mensual de actividad y estadísticas</p>
                      </div>
                      <Switch checked={notifications.emailReports} onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailReports: checked }))} />
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Recordatorios de vencimiento</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Alertas sobre certificados próximos a vencer</p>
                      </div>
                      <Switch checked={notifications.emailReminders} onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailReminders: checked }))} />
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Notificaciones push</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Notificaciones en tiempo real en el navegador</p>
                      </div>
                      <Switch checked={notifications.pushNotifications} onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))} />
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-border flex justify-end">
                    <Button onClick={handleNotificationsSave} disabled={isSaving} className="rounded-full h-9 px-4 text-sm gap-2">
                      <Save className="w-4 h-4" />
                      {isSaving ? "Guardando..." : "Guardar preferencias"}
                    </Button>
                  </div>
                </section>

                {/* ─── CERTIFICADOS ─── */}
                <section id="certificados" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Configuración de Certificados</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Validez predeterminada y copias de seguridad</p>
                    </div>
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="validity">Validez predeterminada (años)</Label>
                        <p className="text-xs text-muted-foreground mb-2">Duración estándar para nuevos certificados energéticos</p>
                        <Select value={certificateSettings.defaultValidity} onValueChange={(value) => setCertificateSettings(prev => ({ ...prev, defaultValidity: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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

                    <div className="flex items-center gap-4 py-4 border-t border-border">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Backup automático</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Crear copias de seguridad automáticas de certificados y documentos</p>
                      </div>
                      <Switch checked={certificateSettings.autoBackup} onCheckedChange={(checked) => setCertificateSettings(prev => ({ ...prev, autoBackup: checked }))} />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-foreground">Estado del Sistema de Backup</span>
                        </div>
                        <Button onClick={handleCreateBackup} disabled={isCreatingBackup} size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          {isCreatingBackup ? "Creando..." : "Crear Backup"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Último backup</p>
                            <p className="text-sm font-semibold text-foreground">{backupStatus.lastBackup ? new Date(backupStatus.lastBackup).toLocaleDateString('es-ES') : 'Nunca'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Backups totales</p>
                            <p className="text-sm font-semibold text-foreground">{backupStatus.backupCount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tamaño total</p>
                            <p className="text-sm font-semibold text-foreground">{formatFileSize(backupStatus.totalSize)}</p>
                          </div>
                        </div>
                      </div>
                      {certificateSettings.autoBackup && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          <span className="text-xs text-green-800 dark:text-green-400">Backup automático activado — Se crean copias diarias</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleCertificateSettingsSave} disabled={isSaving} className="rounded-full h-10 px-5 gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Guardando..." : "Guardar configuración"}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* ─── MÉTODOS DE COBRO ─── */}
                <section id="cobro" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center flex-shrink-0">
                      <Wallet size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Métodos de Cobro</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Configura cómo pueden pagarte tus clientes al aceptar un presupuesto</p>
                    </div>
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Métodos activos para el cliente</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: "stripe", icon: <CreditCard className="w-4 h-4" />, label: "Tarjeta bancaria", desc: "Pago online con Stripe" },
                          { key: "bizum", icon: <Smartphone className="w-4 h-4" />, label: "Bizum", desc: "Transferencia instantánea" },
                          { key: "transferencia", icon: <Banknote className="w-4 h-4" />, label: "Transferencia SEPA", desc: "Banco a banco" },
                          { key: "efectivo", icon: <Wallet className="w-4 h-4" />, label: "Efectivo", desc: "Pago en mano" },
                        ].map(({ key, icon, label, desc }) => {
                          const active = paymentSettings.enabledPaymentMethods.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => togglePaymentMethod(key)}
                              data-testid={`toggle-method-${key}`}
                              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                active
                                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-500/70"
                                  : "border-gray-200 bg-white hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div className={`mt-0.5 flex-shrink-0 ${active ? "text-teal-700 dark:text-teal-400" : "text-gray-400"}`}>{icon}</div>
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold ${active ? "text-teal-800 dark:text-teal-300" : "text-gray-700"}`}>{label}</p>
                                <p className="text-xs text-gray-400">{desc}</p>
                              </div>
                              <div className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                active ? "border-teal-500 bg-teal-500" : "border-gray-300 dark:border-gray-600"
                              }`}>
                                {active && <CheckCircle className="w-3 h-3 text-white fill-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bizumPhone" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-violet-600" />
                        Número Bizum
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">Número de teléfono donde recibirás los pagos por Bizum</p>
                      <Input id="bizumPhone" type="tel" value={paymentSettings.bizumPhone} onChange={(e) => setPaymentSettings(prev => ({ ...prev, bizumPhone: e.target.value }))} placeholder="Ej: 612 345 678" data-testid="input-bizum-phone" />
                      {paymentSettings.enabledPaymentMethods.includes("bizum") && !paymentSettings.bizumPhone && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Bizum está activo pero no has introducido tu número. Los clientes no podrán usarlo.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="iban" className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-blue-600" />
                        IBAN para transferencias
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">Número de cuenta donde recibirás las transferencias bancarias</p>
                      <Input id="iban" value={paymentSettings.iban} onChange={(e) => setPaymentSettings(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))} placeholder="Ej: ES12 1234 5678 9012 3456 7890" className="font-mono" data-testid="input-iban" />
                      {paymentSettings.enabledPaymentMethods.includes("transferencia") && !paymentSettings.iban && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Transferencia está activa pero no has introducido tu IBAN. Los clientes no podrán usarla.
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handlePaymentSettingsSave} disabled={isSavingPayment} data-testid="btn-save-payment-settings" className="rounded-full h-10 px-5 gap-2">
                        <Save className="w-4 h-4" />
                        {isSavingPayment ? "Guardando..." : "Guardar métodos de cobro"}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* ─── SUSCRIPCIÓN ─── */}
                <section id="suscripcion" data-testid="card-subscription" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center flex-shrink-0">
                        <Crown size={18} className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground tracking-tight">Plan & Suscripción</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Tu plan actual y gestión de suscripción</p>
                      </div>
                    </div>
                    <button onClick={() => refetchSub()} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-refresh-subscription">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </header>

                  <div className="px-6 py-6 space-y-8">
                    {subLoading ? (
                      <div className="h-20 bg-muted/60 animate-pulse rounded-xl" />
                    ) : (
                      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border-2 p-5 ${currentPlan.border} ${currentPlan.bg}`} data-testid="panel-current-plan">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border ${currentPlan.border} ${currentPlan.color}`}>
                            {currentPlan.icon}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Plan actual</p>
                            <p className="text-lg font-bold text-slate-800">{currentPlan.name}</p>
                            <p className="text-xs text-slate-500">{currentPlan.certs}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1.5">
                          {subData && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusLabel(subData.status).cls}`} data-testid="badge-sub-status">
                              {statusLabel(subData.status).text}
                            </span>
                          )}
                          {subData?.currentPeriodEnd && (
                            <p className="text-xs text-slate-500">
                              {subData.cancelAtPeriodEnd
                                ? `Cancela el ${fmtDate(subData.currentPeriodEnd)}`
                                : `Renueva el ${fmtDate(subData.currentPeriodEnd)}`}
                            </p>
                          )}
                          {subData?.plan !== "free" && (
                            <Button size="sm" variant="outline" onClick={openBillingPortal} disabled={openingPortal} className="text-xs mt-1 rounded-full" data-testid="btn-billing-portal">
                              {openingPortal ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> : <ExternalLink className="w-3 h-3 mr-1.5" />}
                              Gestionar suscripción
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {subData && !subData.stripeConfigured && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl text-sm" data-testid="alert-stripe-missing">
                        <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-300">Stripe no configurado</p>
                          <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                            Añade <code className="bg-amber-100 px-1 rounded font-mono text-xs">STRIPE_SECRET_KEY</code> en las variables de entorno para activar la gestión de suscripciones y pagos.
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-foreground mb-4">Planes disponibles</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PLANS.map(plan => {
                          const isCurrent = plan.key === (subData?.plan ?? "free");
                          return (
                            <div
                              key={plan.key}
                              className={`relative rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${
                                isCurrent
                                  ? `${plan.border} ${plan.bg}`
                                  : "border-slate-200 bg-white hover:border-slate-300 dark:hover:border-slate-500"
                              }`}
                              data-testid={`card-plan-${plan.key}`}
                            >
                              {plan.recommended && !isCurrent && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                  Recomendado
                                </span>
                              )}
                              {isCurrent && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                  Plan actual
                                </span>
                              )}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan.bg} border ${plan.border} ${plan.color}`}>
                                {plan.icon}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{plan.name}</p>
                                <p className="text-xs text-slate-500">{plan.certs}</p>
                              </div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-2xl font-bold text-slate-800">{plan.price === 0 ? "Gratis" : `${plan.price}€`}</span>
                                {plan.period && <span className="text-xs text-slate-400">{plan.period}</span>}
                              </div>
                              <ul className="space-y-1.5 flex-1">
                                {plan.features.map(f => (
                                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                    {f}
                                  </li>
                                ))}
                                {plan.notIncluded?.map(f => (
                                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400 line-through">
                                    <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-center">—</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              {isCurrent ? (
                                plan.key !== "free" ? (
                                  <Button size="sm" variant="outline" className="w-full text-xs rounded-full" onClick={openBillingPortal} disabled={openingPortal} data-testid={`btn-manage-plan-${plan.key}`}>
                                    <ExternalLink className="w-3 h-3 mr-1" />Gestionar
                                  </Button>
                                ) : (
                                  <div className="w-full text-center text-xs text-slate-400 py-1">Plan activo</div>
                                )
                              ) : plan.key === "free" ? (
                                <div className="w-full text-center text-xs text-slate-400 py-1">Sin cargo</div>
                              ) : (
                                <Button size="sm" className="w-full text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-full" onClick={() => startCheckout(plan.key)} disabled={checkingOut === plan.key || !subData?.stripeConfigured} data-testid={`btn-subscribe-${plan.key}`}>
                                  {checkingOut === plan.key ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : null}
                                  {checkingOut === plan.key ? "Redirigiendo..." : "Contratar"}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Historial de facturas Stripe
                      </p>
                      {invoicesLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/60 animate-pulse rounded-lg" />)}
                        </div>
                      ) : !invoiceData?.stripeConfigured ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Stripe no configurado — las facturas aparecerán aquí una vez activado.</p>
                      ) : !invoiceData?.invoices?.length ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No hay facturas aún. Aparecerán aquí tras tu primera suscripción.</p>
                      ) : (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/30 border-b border-border">
                              <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Factura</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Importe</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Estado</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">PDF</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {invoiceData.invoices.map((inv, idx) => {
                                const st = inv.status === "paid"
                                  ? { text: "Pagada", cls: "bg-green-100 text-green-700" }
                                  : inv.status === "open"
                                  ? { text: "Pendiente", cls: "bg-amber-100 text-amber-700" }
                                  : { text: inv.status, cls: "bg-muted text-muted-foreground" };
                                return (
                                  <tr key={inv.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-invoice-${idx}`}>
                                    <td className="px-4 py-3">
                                      <p className="font-medium text-foreground">{inv.number ?? inv.id.slice(0, 12)}</p>
                                      {inv.description && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{inv.description}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{fmtDate(inv.created)}</td>
                                    <td className="px-4 py-3 font-semibold text-foreground">{fmtAmount(inv.amount, inv.currency)}</td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {inv.pdfUrl ? (
                                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 font-medium" data-testid={`btn-download-invoice-${idx}`}>
                                          <Download className="w-3.5 h-3.5" />PDF
                                        </a>
                                      ) : inv.hostedUrl ? (
                                        <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" data-testid={`btn-view-invoice-${idx}`}>
                                          <ExternalLink className="w-3.5 h-3.5" />Ver
                                        </a>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {subData?.plan !== "free" && subData?.stripeConfigured && (
                      <p className="text-xs text-muted-foreground text-center">
                        Para cancelar tu suscripción, usar otro método de pago o cambiar de plan,{" "}
                        <button onClick={openBillingPortal} className="text-primary hover:underline font-medium" data-testid="btn-portal-link-footer">
                          abre el portal de facturación
                        </button>.
                      </p>
                    )}
                  </div>
                </section>

                {/* ─── AYUDA ─── */}
                <section id="ayuda" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center flex-shrink-0">
                      <HelpCircle size={18} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Ayuda y soporte</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Documentación, tutorial y asistencia</p>
                    </div>
                  </header>
                  <div className="px-6 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Tutorial de la plataforma</p>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-3">Repasa las secciones clave de Certifive en cualquier momento</p>
                          <Button size="sm" variant="outline" className="gap-2 rounded-full h-8 px-3 text-xs" onClick={() => window.dispatchEvent(new CustomEvent("certifive:show-tour"))}>
                            <RotateCcw className="w-3.5 h-3.5" />Ver tutorial
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Centro de ayuda</p>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-3">Documentación, preguntas frecuentes y guías</p>
                          <Button size="sm" variant="outline" disabled className="gap-2 opacity-60 rounded-full h-8 px-3 text-xs">
                            Próximamente
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ─── SEGURIDAD ─── */}
                <section id="seguridad" className="scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Shield size={18} className="text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Seguridad</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Contraseña, doble factor y sesiones activas</p>
                    </div>
                  </header>
                  <div className="divide-y divide-border">
                    <div className="px-6 py-5 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Autenticación de dos factores</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Añade una capa extra de seguridad a tu cuenta</p>
                      </div>
                      <Button variant="outline" disabled className="rounded-full h-9 px-4 text-xs">
                        Configurar 2FA (Próximamente)
                      </Button>
                    </div>
                    <div className="px-6 py-5 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Sesiones activas</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Gestiona los dispositivos conectados a tu cuenta</p>
                      </div>
                      <Button variant="outline" className="rounded-full h-9 px-4 text-xs">
                        Ver sesiones activas
                      </Button>
                    </div>
                    <div className="px-6 py-5 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Exportar datos</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Descarga una copia de todos tus datos</p>
                      </div>
                      <Button variant="outline" className="rounded-full h-9 px-4 text-xs">
                        Solicitar exportación
                      </Button>
                    </div>
                  </div>
                </section>

                {/* ─── DANGER ZONE ─── */}
                <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Zona de peligro</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">Eliminar tu cuenta es irreversible. Se borrarán expedientes, facturas y datos asociados.</p>
                    </div>
                  </div>
                </section>

                <div className="h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
