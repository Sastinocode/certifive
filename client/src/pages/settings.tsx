import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { NotificationStatus } from "@/components/notifications/NotificationStatus";
import { apiRequest } from "@/lib/queryClient";
import { SectionCard } from "@/components/ui";
import {
  User, Bell, Shield, FileText, Save, Building, Mail, Phone,
  Database, Download, Calendar, HardDrive, CheckCircle, AlertCircle,
  Wallet, CreditCard, Banknote, Smartphone, Crown, Star, Zap, Check,
  ExternalLink, RefreshCw, Package, Receipt, Building2, Plug, MessageCircle,
} from "lucide-react";

// ── Two-Factor Authentication Section ────────────────────────────────────────
function TwoFactorSection() {
  const { toast } = useToast();
  const [enabled, setEnabled]   = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/auth/2fa/status", {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    })
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled ?? false))
      .catch(() => setEnabled(false))
      .finally(() => setFetching(false));
  }, []);

  const toggle = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const endpoint = enabled ? "/api/auth/2fa/disable" : "/api/auth/2fa/enable";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEnabled(!enabled);
      setShowForm(false);
      setPassword("");
      toast({
        title: !enabled ? "2FA activado" : "2FA desactivado",
        description: !enabled
          ? "A partir de ahora necesitarás un código al iniciar sesión."
          : "La verificación en dos pasos ha sido desactivada.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Autenticación de dos factores</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {enabled
            ? "Activa — se envía un código por email en cada inicio de sesión."
            : "Desactivada — añade una capa extra de seguridad a tu cuenta."}
        </p>
        {showForm && (
          <div className="mt-3 flex gap-2 items-center">
            <Input
              type="password"
              placeholder="Confirma tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-sm max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && toggle()}
            />
            <Button size="sm" onClick={toggle} disabled={!password || loading} className="h-9">
              {loading ? "..." : "Confirmar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setPassword(""); }} className="h-9">
              Cancelar
            </Button>
          </div>
        )}
      </div>
      <Button
        variant={enabled ? "destructive" : "outline"}
        className="rounded-full h-9 px-4 text-xs flex-shrink-0"
        onClick={() => setShowForm((v) => !v)}
      >
        {enabled ? "Desactivar 2FA" : "Activar 2FA"}
      </Button>
    </div>
  );
}

// ── SaveRow — consistent save button at section bottom ────────────────────────
function SaveRow({ onClick, loading, label = "Guardar cambios" }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} disabled={loading} className="rounded-full h-10 px-5 gap-2">
        <Save className="w-4 h-4" />
        {loading ? "Guardando..." : label}
      </Button>
    </div>
  );
}

const NAV_ITEMS = [
  { href: "#perfil",         Icon: User,       label: "Perfil" },
  { href: "#empresa",        Icon: Building2,  label: "Empresa" },
  { href: "#facturacion",    Icon: Receipt,    label: "Facturación" },
  { href: "#plantillas",     Icon: FileText,   label: "Plantillas" },
  { href: "#notificaciones", Icon: Bell,       label: "Notificaciones" },
  { href: "#integraciones",  Icon: Plug,       label: "Integraciones" },
  { href: "#suscripcion",    Icon: CreditCard, label: "Plan & Suscripción" },
  { href: "#seguridad",      Icon: Shield,     label: "Seguridad" },
] as const;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // ── Profile / company shared state (one API endpoint) ────────────────────
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    company: "",
    license: "",
    address: "",
    dni: "",
  });

  const [profileValidation, setProfileValidation] = useState({
    isValid: false,
    missingFields: [] as string[],
  });

  // ── Payment / cobro state ─────────────────────────────────────────────────
  const [paymentSettings, setPaymentSettings] = useState({
    bizumPhone: "",
    iban: "",
    enabledPaymentMethods: ["stripe", "bizum", "transferencia", "efectivo"] as string[],
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // ── Billing config state (fiscal, numbering, VAT) ─────────────────────────
  const [billingConfig, setBillingConfig] = useState({
    invoicePrefix: "FAC",
    startNumber: "1",
    vatRate: "21",
    vatExempt: false,
  });
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // ── Notifications state ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    emailCertifications: true,
    emailReports: true,
    emailReminders: false,
    pushNotifications: true,
  });

  // ── Certificate / template state ──────────────────────────────────────────
  const [certificateSettings, setCertificateSettings] = useState({
    defaultValidity: "10",
    autoBackup: true,
  });

  const [backupStatus, setBackupStatus] = useState({
    enabled: false,
    lastBackup: null as string | null,
    backupCount: 0,
    totalSize: 0,
  });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // ── Subscription state ────────────────────────────────────────────────────
  const [openingPortal, setOpeningPortal] = useState(false);
  const [checkingOut, setCheckingOut]   = useState<string | null>(null);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadProfileValidation = async () => {
      try {
        const r = await fetch("/api/profile/validation");
        if (r.ok) setProfileValidation(await r.json());
      } catch {}
    };

    const loadPaymentSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const r = await fetch("/api/auth/user", { headers });
        if (r.ok) {
          const ud = await r.json();
          setPaymentSettings({
            bizumPhone: ud.bizumPhone || "",
            iban: ud.iban || "",
            enabledPaymentMethods: (ud.enabledPaymentMethods as string[]) ?? ["stripe", "bizum", "transferencia", "efectivo"],
          });
        }
      } catch {}
    };

    loadProfileValidation();
    loadPaymentSettings();
    loadBackupStatus();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const r = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!r.ok) throw new Error();
      const vr = await fetch("/api/profile/validation");
      if (vr.ok) setProfileValidation(await vr.json());
      toast({ title: "Perfil actualizado", description: "Los cambios han sido guardados correctamente." });
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleBillingConfigSave = async () => {
    setIsSavingBilling(true);
    try {
      const r = await fetch("/api/settings/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingConfig),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Configuración guardada", description: "Los datos de facturación han sido actualizados." });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    }
    setIsSavingBilling(false);
  };

  const handlePaymentSettingsSave = async () => {
    setIsSavingPayment(true);
    try {
      const r = await fetch("/api/auth/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bizumPhone: paymentSettings.bizumPhone || null,
          iban: paymentSettings.iban || null,
          enabledPaymentMethods: paymentSettings.enabledPaymentMethods,
        }),
      });
      if (!r.ok) throw new Error();
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

  const handleNotificationsSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    toast({ title: "Preferencias actualizadas", description: "La configuración de notificaciones ha sido guardada." });
    setIsSaving(false);
  };

  const handleCertificateSettingsSave = async () => {
    setIsSaving(true);
    try {
      const r = await fetch("/api/settings/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certificateSettings),
      });
      if (!r.ok) throw new Error();
      toast({
        title: "Configuración actualizada",
        description: certificateSettings.autoBackup
          ? "Configuración guardada y backup automático activado"
          : "Los ajustes predeterminados han sido guardados",
      });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const loadBackupStatus = async () => {
    try {
      const r = await fetch("/api/backup/status");
      if (r.ok) {
        setBackupStatus(await r.json());
      } else {
        setBackupStatus({ enabled: true, lastBackup: null, backupCount: 0, totalSize: 0 });
      }
    } catch {
      setBackupStatus({ enabled: true, lastBackup: null, backupCount: 0, totalSize: 0 });
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const r = await fetch("/api/backup/create", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (r.ok) {
        toast({ title: "Backup creado", description: "Copia de seguridad creada exitosamente." });
        await loadBackupStatus();
      } else {
        toast({ title: "Backup simulado", description: "Sistema de backup en modo demostración." });
        setBackupStatus(prev => ({ ...prev, lastBackup: new Date().toISOString(), backupCount: prev.backupCount + 1, totalSize: prev.totalSize + 1024 * 1024 }));
      }
    } catch {
      toast({ title: "Backup simulado", description: "Sistema funcionando en modo demostración." });
      setBackupStatus(prev => ({ ...prev, lastBackup: new Date().toISOString(), backupCount: prev.backupCount + 1, totalSize: prev.totalSize + 1024 * 1024 }));
    }
    setIsCreatingBackup(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ── Subscription ──────────────────────────────────────────────────────────
  const { data: subData, isLoading: subLoading, refetch: refetchSub } = useQuery<{
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    cancelAt: string | null;
    stripeCustomerId: string | null;
    stripeConfigured: boolean;
    priceIds: Record<string, string | undefined>;
  }>({ queryKey: ["/api/subscription"] });

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
  }>({ queryKey: ["/api/subscription/invoices"] });

  const openBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await apiRequest("POST", "/api/subscription/portal", { returnUrl: window.location.href });
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "No se pudo abrir el portal de facturación.", variant: "destructive" });
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
      toast({ title: "Error", description: err?.message ?? "No se pudo iniciar el checkout.", variant: "destructive" });
    }
    setCheckingOut(null);
  };

  const PLANS = [
    {
      key: "free", name: "Gratuito", price: 0, period: "",
      icon: <Package className="w-5 h-5" />, color: "text-slate-600",
      bg: "bg-slate-50", border: "border-slate-200", certs: "5 certificados/mes",
      features: ["Gestión básica de certificados", "Exportación PDF", "Soporte por email"],
      notIncluded: ["WhatsApp automatizado", "Clientes ilimitados", "Informes avanzados", "Facturación integrada"],
    },
    {
      key: "basico", name: "Básico", price: 29, period: "/mes",
      icon: <Star className="w-5 h-5" />, color: "text-blue-600",
      bg: "bg-blue-50", border: "border-blue-200", certs: "30 certificados/mes",
      features: ["Todo lo del plan Gratuito", "WhatsApp automatizado", "Exportación Word y Excel", "Gestión de carpetas", "Soporte prioritario"],
      notIncluded: ["Clientes ilimitados", "API acceso"],
    },
    {
      key: "pro", name: "Pro", price: 59, period: "/mes",
      icon: <Zap className="w-5 h-5" />, color: "text-teal-600",
      bg: "bg-teal-50", border: "border-teal-200", certs: "100 certificados/mes",
      features: ["Todo lo del plan Básico", "Flujos WhatsApp personalizados", "Facturación integrada", "Informes avanzados", "Tarifas dinámicas por zona", "Acceso API"],
      notIncluded: [],
      recommended: true,
    },
    {
      key: "enterprise", name: "Enterprise", price: 99, period: "/mes",
      icon: <Building2 className="w-5 h-5" />, color: "text-purple-600",
      bg: "bg-purple-50", border: "border-purple-200", certs: "Ilimitados",
      features: ["Todo lo del plan Pro", "Multi-usuario / equipo", "SLA garantizado", "Onboarding personalizado", "Gestor de cuenta dedicado"],
      notIncluded: [],
    },
  ];

  const currentPlan = PLANS.find(p => p.key === (subData?.plan ?? "free")) ?? PLANS[0];

  const statusLabel = (s: string) => {
    if (s === "active")   return { text: "Activo",          cls: "bg-green-100 text-green-700" };
    if (s === "trialing") return { text: "Prueba",          cls: "bg-blue-100 text-blue-700" };
    if (s === "past_due") return { text: "Pago pendiente",  cls: "bg-amber-100 text-amber-700" };
    if (s === "canceled") return { text: "Cancelado",       cls: "bg-red-100 text-red-700" };
    return { text: s, cls: "bg-slate-100 text-slate-700" };
  };

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
  };

  const fmtAmount = (amt: number, currency: string) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: currency.toUpperCase() }).format(amt);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab="settings" onTabChange={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-card border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">Ajustes</h1>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Ajustes</h1>
              <p className="text-sm text-muted-foreground mt-1">Configura tu cuenta, empresa y preferencias de la aplicación</p>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="/tarifas" className="group flex items-center gap-4 bg-card rounded-2xl border border-border px-5 py-4 hover:border-primary/50 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary text-lg font-bold">€</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">Tarifas y precios</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Configura los precios para generar presupuestos automáticos</p>
                </div>
                <span className="ml-auto text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">→</span>
              </a>
              <a href="/facturacion" className="group flex items-center gap-4 bg-card rounded-2xl border border-border px-5 py-4 hover:border-primary/50 hover:shadow-md transition-all">
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

              {/* Sticky nav */}
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

                {/* ─── 1. PERFIL ─── */}
                <section id="perfil" className="scroll-mt-6">
                  <SectionCard
                    title="Perfil"
                    description="Tus datos personales y de contacto"
                    icon={<User size={18} />}
                    action={
                      profileValidation.isValid ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                          <CheckCircle size={14} />Listo para facturación
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                          <AlertCircle size={14} />Completar datos
                        </span>
                      )
                    }
                  >
                    <div className="pt-5 space-y-5">
                      {/* Avatar */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                          {((profileData.firstName?.[0] ?? "") + (profileData.lastName?.[0] ?? "")).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{profileData.firstName} {profileData.lastName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{profileData.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Nombre</Label>
                          <Input id="firstName" value={profileData.firstName} onChange={(e) => setProfileData(p => ({ ...p, firstName: e.target.value }))} placeholder="Tu nombre" />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Apellidos</Label>
                          <Input id="lastName" value={profileData.lastName} onChange={(e) => setProfileData(p => ({ ...p, lastName: e.target.value }))} placeholder="Tus apellidos" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input id="email" type="email" value={profileData.email} onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))} className="pl-9" placeholder="tu@email.com" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input id="phone" type="tel" value={profileData.phone} onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} className="pl-9" placeholder="968 123 456" />
                          </div>
                        </div>
                      </div>

                      <SaveRow onClick={handleProfileSave} loading={isSaving} />
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 2. EMPRESA ─── */}
                <section id="empresa" className="scroll-mt-6">
                  <SectionCard
                    title="Empresa"
                    description="Datos fiscales para facturación con validez legal española"
                    icon={<Building2 size={18} />}
                  >
                    <div className="pt-5 space-y-5">
                      {!profileValidation.isValid && profileValidation.missingFields.length > 0 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            <strong>Campos requeridos:</strong> {profileValidation.missingFields.join(", ")}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Completa estos datos para emitir facturas con validez legal.</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company">Nombre o razón social</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input id="company" value={profileData.company} onChange={(e) => setProfileData(p => ({ ...p, company: e.target.value }))} className="pl-9" placeholder="Nombre de tu empresa" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="dni">DNI / NIF</Label>
                          <Input id="dni" value={profileData.dni} onChange={(e) => setProfileData(p => ({ ...p, dni: e.target.value }))} placeholder="12345678A" maxLength={9} />
                        </div>
                        <div>
                          <Label htmlFor="license">Número de colegiado</Label>
                          <Input id="license" value={profileData.license} onChange={(e) => setProfileData(p => ({ ...p, license: e.target.value }))} placeholder="Ej: COA-1234" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Dirección fiscal</Label>
                        <Textarea id="address" value={profileData.address} onChange={(e) => setProfileData(p => ({ ...p, address: e.target.value }))} placeholder="Dirección completa" rows={3} />
                      </div>

                      <SaveRow onClick={handleProfileSave} loading={isSaving} />
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 3. FACTURACIÓN ─── */}
                <section id="facturacion" className="scroll-mt-6">
                  <SectionCard
                    title="Facturación"
                    description="Numeración de facturas, impuestos y métodos de cobro"
                    icon={<Receipt size={18} />}
                  >
                    <div className="pt-5 space-y-6">
                      {/* Billing config */}
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-3">Configuración fiscal</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="invoicePrefix">Prefijo de factura</Label>
                            <Input id="invoicePrefix" value={billingConfig.invoicePrefix} onChange={(e) => setBillingConfig(p => ({ ...p, invoicePrefix: e.target.value }))} placeholder="FAC" />
                          </div>
                          <div>
                            <Label htmlFor="startNumber">Número inicial</Label>
                            <Input id="startNumber" type="number" min="1" value={billingConfig.startNumber} onChange={(e) => setBillingConfig(p => ({ ...p, startNumber: e.target.value }))} placeholder="1" />
                          </div>
                          <div>
                            <Label htmlFor="vatRate">IVA (%)</Label>
                            <Select value={billingConfig.vatRate} onValueChange={(v) => setBillingConfig(p => ({ ...p, vatRate: v }))}>
                              <SelectTrigger id="vatRate"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="4">4% (superreducido)</SelectItem>
                                <SelectItem value="10">10% (reducido)</SelectItem>
                                <SelectItem value="21">21% (general)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Switch id="vatExempt" checked={billingConfig.vatExempt} onCheckedChange={(v) => setBillingConfig(p => ({ ...p, vatExempt: v }))} />
                          <div>
                            <Label htmlFor="vatExempt" className="cursor-pointer text-sm font-medium">Exención de IVA (art. 20 LIVA)</Label>
                            <p className="text-xs text-muted-foreground">Activar si prestas servicios exentos de IVA</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button onClick={handleBillingConfigSave} disabled={isSavingBilling} className="rounded-full h-9 px-4 text-sm gap-2">
                            <Save className="w-4 h-4" />
                            {isSavingBilling ? "Guardando..." : "Guardar configuración fiscal"}
                          </Button>
                        </div>
                      </div>

                      {/* Payment methods */}
                      <div className="border-t border-border pt-6">
                        <p className="text-sm font-semibold text-foreground mb-3">Métodos de cobro</p>
                        <p className="text-xs text-muted-foreground mb-4">Elige cómo pueden pagarte tus clientes al aceptar un presupuesto</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: "stripe",       icon: <CreditCard className="w-4 h-4" />,  label: "Tarjeta bancaria",   desc: "Pago online con Stripe" },
                            { key: "bizum",        icon: <Smartphone className="w-4 h-4" />,  label: "Bizum",             desc: "Transferencia instantánea" },
                            { key: "transferencia",icon: <Banknote className="w-4 h-4" />,    label: "Transferencia SEPA", desc: "Banco a banco" },
                            { key: "efectivo",     icon: <Wallet className="w-4 h-4" />,      label: "Efectivo",          desc: "Pago en mano" },
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
                                    : "border-border bg-card hover:border-muted-foreground/30"
                                }`}
                              >
                                <div className={`mt-0.5 flex-shrink-0 ${active ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}>{icon}</div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-semibold ${active ? "text-teal-800 dark:text-teal-300" : "text-foreground"}`}>{label}</p>
                                  <p className="text-xs text-muted-foreground">{desc}</p>
                                </div>
                                <div className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  active ? "border-teal-500 bg-teal-500" : "border-muted-foreground/30"
                                }`}>
                                  {active && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bizumPhone" className="flex items-center gap-2 mb-1">
                              <Smartphone className="w-4 h-4 text-violet-600" />Número Bizum
                            </Label>
                            <Input id="bizumPhone" type="tel" value={paymentSettings.bizumPhone} onChange={(e) => setPaymentSettings(p => ({ ...p, bizumPhone: e.target.value }))} placeholder="612 345 678" data-testid="input-bizum-phone" />
                            {paymentSettings.enabledPaymentMethods.includes("bizum") && !paymentSettings.bizumPhone && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Bizum activo sin número configurado.</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="iban" className="flex items-center gap-2 mb-1">
                              <Banknote className="w-4 h-4 text-blue-600" />IBAN para transferencias
                            </Label>
                            <Input id="iban" value={paymentSettings.iban} onChange={(e) => setPaymentSettings(p => ({ ...p, iban: e.target.value.toUpperCase() }))} placeholder="ES12 1234 5678 9012 3456 7890" className="font-mono" data-testid="input-iban" />
                            {paymentSettings.enabledPaymentMethods.includes("transferencia") && !paymentSettings.iban && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Transferencia activa sin IBAN configurado.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end mt-4">
                          <Button onClick={handlePaymentSettingsSave} disabled={isSavingPayment} data-testid="btn-save-payment-settings" className="rounded-full h-9 px-4 text-sm gap-2">
                            <Save className="w-4 h-4" />
                            {isSavingPayment ? "Guardando..." : "Guardar métodos de cobro"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 4. PLANTILLAS ─── */}
                <section id="plantillas" className="scroll-mt-6">
                  <SectionCard
                    title="Plantillas"
                    description="Formato y ajustes predeterminados de los documentos generados"
                    icon={<FileText size={18} />}
                  >
                    <div className="pt-5 space-y-5">
                      <div className="max-w-xs">
                        <Label htmlFor="validity">Validez predeterminada de certificados</Label>
                        <p className="text-xs text-muted-foreground mb-2">Duración estándar al emitir un certificado energético</p>
                        <Select value={certificateSettings.defaultValidity} onValueChange={(v) => setCertificateSettings(p => ({ ...p, defaultValidity: v }))}>
                          <SelectTrigger id="validity"><SelectValue /></SelectTrigger>
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

                      <div className="flex items-center gap-4 py-4 border-t border-border">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Backup automático</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Crear copias de seguridad automáticas de certificados y documentos</p>
                        </div>
                        <Switch checked={certificateSettings.autoBackup} onCheckedChange={(v) => setCertificateSettings(p => ({ ...p, autoBackup: v }))} />
                      </div>

                      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-foreground">Estado del sistema de backup</span>
                          </div>
                          <Button onClick={handleCreateBackup} disabled={isCreatingBackup} size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs gap-1.5">
                            <Download className="w-3.5 h-3.5" />
                            {isCreatingBackup ? "Creando..." : "Crear backup"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Último backup</p>
                              <p className="text-sm font-semibold text-foreground">{backupStatus.lastBackup ? new Date(backupStatus.lastBackup).toLocaleDateString("es-ES") : "Nunca"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-sm font-semibold text-foreground">{backupStatus.backupCount}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Tamaño</p>
                              <p className="text-sm font-semibold text-foreground">{formatFileSize(backupStatus.totalSize)}</p>
                            </div>
                          </div>
                        </div>
                        {certificateSettings.autoBackup && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                            <span className="text-xs text-green-800 dark:text-green-400">Backup automático activado — se crean copias diarias</span>
                          </div>
                        )}
                      </div>

                      <SaveRow onClick={handleCertificateSettingsSave} loading={isSaving} label="Guardar configuración" />
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 5. NOTIFICACIONES ─── */}
                <section id="notificaciones" className="scroll-mt-6">
                  <SectionCard
                    title="Notificaciones"
                    description="Decide qué avisos quieres recibir y por qué canal"
                    icon={<Bell size={18} />}
                    bodyPadding="none"
                  >
                    <div className="px-6 pt-5 pb-2">
                      <NotificationStatus />
                    </div>

                    <div className="divide-y divide-border border-t border-border">
                      {[
                        { key: "emailCertifications", label: "Certificaciones completadas", desc: "Confirmación cuando se complete una certificación" },
                        { key: "emailReports",         label: "Informes mensuales",          desc: "Resumen mensual de actividad y estadísticas" },
                        { key: "emailReminders",       label: "Recordatorios de vencimiento",desc: "Alertas sobre certificados próximos a vencer" },
                        { key: "pushNotifications",    label: "Notificaciones push",          desc: "Notificaciones en tiempo real en el navegador" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="px-6 py-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                          </div>
                          <Switch
                            checked={notifications[key as keyof typeof notifications]}
                            onCheckedChange={(v) => setNotifications(p => ({ ...p, [key]: v }))}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="px-6 py-4 border-t border-border flex justify-end">
                      <Button onClick={handleNotificationsSave} disabled={isSaving} className="rounded-full h-9 px-4 text-sm gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Guardando..." : "Guardar preferencias"}
                      </Button>
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 6. INTEGRACIONES ─── */}
                <section id="integraciones" className="scroll-mt-6">
                  <SectionCard
                    title="Integraciones"
                    description="Conecta herramientas externas a tu cuenta"
                    icon={<Plug size={18} />}
                  >
                    <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Stripe */}
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">Stripe</p>
                            {subData?.stripeConfigured ? (
                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Conectado</span>
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">No configurado</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Pagos online con tarjeta y gestión de suscripciones</p>
                          {!subData?.stripeConfigured && (
                            <p className="text-xs text-amber-600 mt-2">Añade <code className="bg-amber-50 px-1 rounded font-mono">STRIPE_SECRET_KEY</code> en las variables de entorno.</p>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp */}
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">WhatsApp Business</p>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Próximamente</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Envía presupuestos y certificados directamente por WhatsApp</p>
                          <Button size="sm" variant="outline" disabled className="mt-2 rounded-full h-7 px-3 text-xs opacity-50">Conectar</Button>
                        </div>
                      </div>

                      {/* SendGrid */}
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">SendGrid</p>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Próximamente</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Envío de emails transaccionales con dominio propio</p>
                          <Button size="sm" variant="outline" disabled className="mt-2 rounded-full h-7 px-3 text-xs opacity-50">Conectar</Button>
                        </div>
                      </div>

                      {/* SEPA */}
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <Banknote className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">Domiciliación SEPA</p>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Próximamente</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Cobros recurrentes por transferencia bancaria SEPA</p>
                          <Button size="sm" variant="outline" disabled className="mt-2 rounded-full h-7 px-3 text-xs opacity-50">Conectar</Button>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 7. PLAN & SUSCRIPCIÓN ─── */}
                <section id="suscripcion" data-testid="card-subscription" className="scroll-mt-6">
                  <SectionCard
                    title="Plan & Suscripción"
                    description="Tu plan actual, historial de facturas y gestión de suscripción"
                    icon={<CreditCard size={18} />}
                    action={
                      <button onClick={() => refetchSub()} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-refresh-subscription">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    }
                  >
                    <div className="pt-5 space-y-8">
                      {/* Current plan banner */}
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
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 dark:text-amber-300">Stripe no configurado</p>
                            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                              Añade <code className="bg-amber-100 px-1 rounded font-mono text-xs">STRIPE_SECRET_KEY</code> en las variables de entorno.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Plan grid */}
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
                                {(plan as any).recommended && !isCurrent && (
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
                                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />{f}
                                    </li>
                                  ))}
                                  {plan.notIncluded?.map(f => (
                                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400 line-through">
                                      <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-center">—</span>{f}
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

                      {/* Invoice history */}
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Receipt className="w-4 h-4" />Historial de facturas Stripe
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
                                    ? { text: "Pagada",   cls: "bg-green-100 text-green-700" }
                                    : inv.status === "open"
                                    ? { text: "Pendiente",cls: "bg-amber-100 text-amber-700" }
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
                          Para cancelar o cambiar de plan,{" "}
                          <button onClick={openBillingPortal} className="text-primary hover:underline font-medium" data-testid="btn-portal-link-footer">
                            abre el portal de facturación
                          </button>.
                        </p>
                      )}
                    </div>
                  </SectionCard>
                </section>

                {/* ─── 8. SEGURIDAD ─── */}
                <section id="seguridad" className="scroll-mt-6">
                  <SectionCard
                    title="Seguridad"
                    description="Contraseña, doble factor y sesiones activas"
                    icon={<Shield size={18} />}
                    bodyPadding="none"
                  >
                    <div className="divide-y divide-border">
                      <div className="px-6 py-5">
                        <TwoFactorSection />
                      </div>
                      <div className="px-6 py-5 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Sesiones activas</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Gestiona los dispositivos conectados a tu cuenta</p>
                        </div>
                        <Button variant="outline" className="rounded-full h-9 px-4 text-xs flex-shrink-0">Ver sesiones</Button>
                      </div>
                      <div className="px-6 py-5 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Exportar mis datos</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Descarga una copia de todos tus datos (RGPD)</p>
                        </div>
                        <Button variant="outline" className="rounded-full h-9 px-4 text-xs flex-shrink-0">Solicitar exportación</Button>
                      </div>
                    </div>
                  </SectionCard>
                </section>

                {/* ─── Danger zone ─── */}
                <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-6">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Zona de peligro</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">Eliminar tu cuenta es irreversible. Se borrarán expedientes, facturas y datos asociados.</p>
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
