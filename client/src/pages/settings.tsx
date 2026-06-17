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

// ── Field classes — Tailwind translation of HTML .field-input / .field-textarea ──
const FIELD_INPUT =
  "w-full h-[42px] px-3.5 bg-card border border-border rounded-[10px] text-sm text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10";
const FIELD_TEXTAREA =
  "w-full px-3.5 py-3 bg-card border border-border rounded-[10px] text-sm text-foreground resize-y min-h-[88px] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10";

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
  const [activeSection, setActiveSection] = useState("perfil");

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

  // ── Scroll-spy: sync active nav item with the section in view ─────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: "-20% 0px -70% 0px" }
    );

    NAV_ITEMS.forEach(({ href }) => {
      const el = document.getElementById(href.slice(1));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
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
      icon: <Package className="w-5 h-5" />, color: "text-muted-foreground",
      bg: "bg-muted/40", border: "border-border", certs: "5 certificados/mes",
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
    return { text: s, cls: "bg-muted text-muted-foreground" };
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

        <div className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Ajustes</h1>
                <p className="text-sm text-muted-foreground mt-1">Configura tu cuenta, empresa y preferencias de la aplicación</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-10 px-4 rounded-full text-sm font-medium border border-border bg-card hover:bg-muted/40">Cancelar</button>
                <button className="h-10 px-5 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-sm inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Guardar cambios
                </button>
              </div>
            </div>

            {/* Layout: nav + content */}
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

              {/* Settings nav */}
              <nav className="bg-card rounded-2xl border border-border shadow-sm p-2 h-fit lg:sticky lg:top-6">
                <ul className="space-y-0.5 text-sm">
                  {NAV_ITEMS.map(({ href, Icon, label }) => {
                    const isActive = activeSection === href.slice(1);
                    return (
                      <li key={href}>
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveSection(href.slice(1));
                            document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium ${
                            isActive
                              ? "bg-primary/8 text-primary"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center ${
                            isActive ? "bg-primary/15 text-primary" : ""
                          }`}>
                            <Icon size={15} />
                          </span>
                          {label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="space-y-6 min-w-0">

                {/* ─── 1. PERFIL ─── */}
                <section id="perfil" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                      <User className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Perfil</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Tus datos personales y cómo te ven dentro de la app</p>
                    </div>
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                        {((profileData.firstName?.[0] ?? "") + (profileData.lastName?.[0] ?? "")).toUpperCase() || "?"}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <button className="h-9 px-3.5 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Subir foto
                          </button>
                          <button className="h-9 px-3.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Eliminar</button>
                        </div>
                        <p className="text-xs text-muted-foreground">JPG o PNG · máximo 2 MB · recomendado 400×400</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Nombre</label>
                        <input className={FIELD_INPUT} value={profileData.firstName} onChange={(e) => setProfileData(p => ({ ...p, firstName: e.target.value }))} placeholder="Javier" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Apellidos</label>
                        <input className={FIELD_INPUT} value={profileData.lastName} onChange={(e) => setProfileData(p => ({ ...p, lastName: e.target.value }))} placeholder="Marín Castellanos" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Email</label>
                        <input className={FIELD_INPUT} type="email" value={profileData.email} onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="javier@certifive.es" />
                        <p className="text-[11px] text-muted-foreground mt-1.5">Recibirás un correo de verificación si lo cambias</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Teléfono</label>
                        <input className={FIELD_INPUT} type="tel" value={profileData.phone} onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} placeholder="+34 612 345 678" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Cargo</label>
                        <input className={FIELD_INPUT} value={profileData.company} onChange={(e) => setProfileData(p => ({ ...p, company: e.target.value }))} placeholder="Técnico certificador" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Idioma</label>
                        <button className={`${FIELD_INPUT} text-left flex items-center justify-between hover:bg-muted/40`}>
                          Español (España)
                          <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ─── 2. EMPRESA ─── */}
                <section id="empresa" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-[18px] h-[18px] text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Empresa</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Datos fiscales que aparecerán en tus facturas y certificados</p>
                    </div>
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    {/* Logo */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Logo de empresa</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-xl bg-muted/60 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                          <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="text-[10px] font-medium">Sin logo</span>
                        </div>
                        <div className="space-y-1.5">
                          <button className="h-9 px-3.5 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40">Subir logo</button>
                          <p className="text-xs text-muted-foreground">SVG, PNG con fondo transparente · máximo 2 MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Razón social</label>
                        <input className={FIELD_INPUT} value={profileData.company} onChange={(e) => setProfileData(p => ({ ...p, company: e.target.value }))} placeholder="Certifive Soluciones Energéticas S.L." />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Nombre comercial</label>
                        <input className={FIELD_INPUT} value={profileData.company} onChange={(e) => setProfileData(p => ({ ...p, company: e.target.value }))} placeholder="Certifive" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">NIF / CIF</label>
                        <input className={FIELD_INPUT} value={profileData.dni} onChange={(e) => setProfileData(p => ({ ...p, dni: e.target.value }))} placeholder="B-87654321" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Número de colegiado</label>
                        <input className={FIELD_INPUT} value={profileData.license} onChange={(e) => setProfileData(p => ({ ...p, license: e.target.value }))} placeholder="COIIM-21548" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Colegio profesional</label>
                        <input className={FIELD_INPUT} placeholder="COIIM — Madrid" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Dirección</label>
                        <input className={FIELD_INPUT} value={profileData.address} onChange={(e) => setProfileData(p => ({ ...p, address: e.target.value }))} placeholder="C/ Velázquez 87, 3º B" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Código postal</label>
                        <input className={FIELD_INPUT} placeholder="28006" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Ciudad</label>
                        <input className={FIELD_INPUT} placeholder="Madrid" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Provincia</label>
                        <input className={FIELD_INPUT} placeholder="Madrid" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">País</label>
                        <button className={`${FIELD_INPUT} text-left flex items-center justify-between hover:bg-muted/40`}>
                          España
                          <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ─── 3. FACTURACIÓN ─── */}
                <section id="facturacion" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-[18px] h-[18px] text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Facturación</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Configuración fiscal, numeración e impuestos por defecto</p>
                    </div>
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Serie de factura</label>
                        <input className={FIELD_INPUT} value={billingConfig.invoicePrefix} onChange={(e) => setBillingConfig(p => ({ ...p, invoicePrefix: e.target.value }))} placeholder="CERT-2026-" />
                        <p className="text-[11px] text-muted-foreground mt-1.5">Prefijo que se añade automáticamente al número</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Siguiente número</label>
                        <input className={FIELD_INPUT} type="number" value={billingConfig.startNumber} onChange={(e) => setBillingConfig(p => ({ ...p, startNumber: e.target.value }))} placeholder="0025" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">IVA por defecto</label>
                        <button className={`${FIELD_INPUT} text-left flex items-center justify-between hover:bg-muted/40`}>
                          21 % — General
                          <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Retención IRPF</label>
                        <button className={`${FIELD_INPUT} text-left flex items-center justify-between hover:bg-muted/40`}>
                          7 % — Reducida (primeros 2 años)
                          <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Moneda</label>
                        <button className={`${FIELD_INPUT} text-left flex items-center justify-between hover:bg-muted/40`}>
                          EUR — €
                          <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">Vencimiento por defecto</label>
                        <button className={`${FIELD_INPUT} text-left flex items-center justify-between hover:bg-muted/40`}>
                          30 días
                          <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Notas al pie de factura</label>
                      <textarea className={FIELD_TEXTAREA} placeholder="Conforme al Real Decreto 235/2013, este certificado tiene una validez de 10 años desde la fecha de emisión." />
                    </div>

                    {/* IBAN block */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-wrap items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/><path d="M6 14h.01M10 14h2"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Cuenta bancaria</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{paymentSettings.iban || "ES76 **** **** **** **** 4521"}</p>
                      </div>
                      <button className="h-9 px-3.5 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40">Cambiar IBAN</button>
                    </div>
                  </div>
                </section>

                {/* ─── 4. PLANTILLAS ─── */}
                <section id="plantillas" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground tracking-tight">Plantillas de documentos</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Formato y plantillas que se aplican a tus PDFs</p>
                      </div>
                    </div>
                    <button className="h-10 px-4 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Nueva plantilla
                    </button>
                  </header>

                  <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Template card · active */}
                    <div className="rounded-2xl border-2 border-primary bg-primary/[0.04] dark:bg-primary/[0.08] p-4 relative">
                      <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground">En uso</span>
                      <div className="aspect-[3/4] rounded-lg bg-card border border-border mb-3 overflow-hidden">
                        <div className="h-1.5 bg-primary"></div>
                        <div className="p-3 space-y-1.5">
                          <div className="h-2 bg-muted rounded w-2/3"></div>
                          <div className="h-1.5 bg-muted rounded w-1/2"></div>
                          <div className="h-px bg-border my-2"></div>
                          <div className="h-1 bg-muted rounded w-full"></div>
                          <div className="h-1 bg-muted rounded w-5/6"></div>
                          <div className="h-1 bg-muted rounded w-4/6"></div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">Certifive Estándar</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Plantilla por defecto · verde corporativo</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-[3/4] rounded-lg bg-card border border-border mb-3 overflow-hidden">
                        <div className="h-8 bg-[#0f1f2e] dark:bg-[#0a1620]"></div>
                        <div className="p-3 space-y-1.5">
                          <div className="h-2 bg-muted rounded w-2/3"></div>
                          <div className="h-1.5 bg-muted rounded w-1/2"></div>
                          <div className="h-px bg-border my-2"></div>
                          <div className="h-1 bg-muted rounded w-full"></div>
                          <div className="h-1 bg-muted rounded w-5/6"></div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">Cabecera oscura</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Estilo profesional · alto contraste</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-[3/4] rounded-lg bg-card border border-border mb-3 overflow-hidden">
                        <div className="grid grid-cols-2 h-full">
                          <div className="bg-muted/60 border-r border-border"></div>
                          <div className="p-2 space-y-1">
                            <div className="h-1.5 bg-muted rounded w-3/4"></div>
                            <div className="h-1 bg-muted rounded w-2/3"></div>
                            <div className="h-1 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">Lateral con logo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Para certificados con foto del inmueble</p>
                    </div>
                  </div>
                </section>

                {/* ─── 5. NOTIFICACIONES ─── */}
                <section id="notificaciones" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-[18px] h-[18px] text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Notificaciones</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Decide qué avisos quieres recibir y por qué canal</p>
                    </div>
                  </header>

                  <div className="divide-y divide-border">
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Nueva factura pagada</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Cuando un cliente confirma el pago de una factura</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={notifications.emailCertifications} onCheckedChange={(v) => setNotifications(p => ({ ...p, emailCertifications: v }))} />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={notifications.pushNotifications} onCheckedChange={(v) => setNotifications(p => ({ ...p, pushNotifications: v }))} />
                          Push
                        </label>
                      </div>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Factura vencida</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Te recordamos cuando una factura supera la fecha de pago</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={notifications.emailReports} onCheckedChange={(v) => setNotifications(p => ({ ...p, emailReports: v }))} />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={false} />
                          Push
                        </label>
                      </div>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Expediente registrado</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Confirmación del registro oficial del certificado</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={true} />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={true} />
                          Push
                        </label>
                      </div>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Resumen semanal</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Cada lunes recibirás un resumen de tu actividad</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={notifications.emailReminders} onCheckedChange={(v) => setNotifications(p => ({ ...p, emailReminders: v }))} />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={false} />
                          Push
                        </label>
                      </div>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Novedades del producto</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Funciones nuevas, mejoras y consejos de uso</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={true} />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={false} />
                          Push
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ─── 6. INTEGRACIONES ─── */}
                <section id="integraciones" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center flex-shrink-0">
                      <Plug className="w-[18px] h-[18px] text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Integraciones</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Conecta Certifive con tus herramientas habituales</p>
                    </div>
                  </header>

                  <div className="divide-y divide-border">
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#fef3c7] dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📮</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">Registro IDAE / CCAA</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground">Conectado</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Registro automático de certificados energéticos en la CCAA</p>
                      </div>
                      <button className="h-9 px-3.5 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40">Configurar</button>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#e0f2fe] dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🏦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">Stripe</p>
                          {subData?.stripeConfigured ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground">Conectado</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">No configurado</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Cobra facturas con tarjeta o Bizum directamente desde el PDF</p>
                      </div>
                      <button className="h-9 px-3.5 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40">Configurar</button>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Google Calendar</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Sincroniza las visitas técnicas con tu calendario</p>
                      </div>
                      <button className="h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Conectar</button>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📊</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Holded · Contabilidad</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Exporta automáticamente facturas a tu gestor contable</p>
                      </div>
                      <button className="h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Conectar</button>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🔗</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">API & Webhooks</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Integra Certifive con sistemas a medida vía REST</p>
                      </div>
                      <button className="h-9 px-3.5 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40">Ver claves API</button>
                    </div>
                  </div>
                </section>

                {/* ─── 7. PLAN & SUSCRIPCIÓN ─── (keep existing subscription section but update header) */}
                <section id="suscripcion" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center flex-shrink-0">
                      <Star className="w-[18px] h-[18px] text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Plan & Suscripción</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Tu plan actual, consumo y método de pago</p>
                    </div>
                  </header>

                  <div className="px-6 py-6 space-y-6">
                    {/* Current plan */}
                    <div className="rounded-2xl bg-gradient-to-br from-[#0f1f2e] to-[#1a3247] dark:from-[#0a1620] dark:to-[#0f2235] p-6 text-white">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">Plan actual</p>
                          <div className="flex items-end gap-3 mt-1.5">
                            <p className="text-3xl font-bold tracking-tight">{currentPlan.name}</p>
                            <p className="text-sm text-white/70 pb-1">{currentPlan.price} € / mes · facturación anual</p>
                          </div>
                          {subData?.currentPeriodEnd && (
                            <p className="text-xs text-white/60 mt-2">Renovación automática el {fmtDate(subData.currentPeriodEnd)}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="h-9 px-4 rounded-full bg-white/10 border border-white/15 text-sm font-medium text-white hover:bg-white/15">Comparar planes</button>
                          {subData?.plan !== "pro" && subData?.plan !== "enterprise" && (
                            <button onClick={() => startCheckout("pro")} className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              Subir a Pro
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">Certificados / mes</p>
                          <p className="text-lg font-bold mt-1">87 <span className="text-sm text-white/50 font-medium">/ 200</span></p>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-primary" style={{width: "43%"}}></div></div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">Almacenamiento</p>
                          <p className="text-lg font-bold mt-1">3,2 GB <span className="text-sm text-white/50 font-medium">/ 50 GB</span></p>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-primary" style={{width: "6%"}}></div></div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">Usuarios</p>
                          <p className="text-lg font-bold mt-1">2 <span className="text-sm text-white/50 font-medium">/ 5</span></p>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-primary" style={{width: "40%"}}></div></div>
                        </div>
                      </div>
                    </div>

                    {/* Payment method + billing history */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">Método de pago</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold tracking-wider">VISA</div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">•••• •••• •••• 4242</p>
                            <p className="text-xs text-muted-foreground">Caduca 09 / 2028</p>
                          </div>
                          <button className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40">Cambiar</button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Facturas recientes</p>
                          <button onClick={openBillingPortal} className="text-xs font-medium text-primary hover:underline">Ver todas</button>
                        </div>
                        <ul className="space-y-1.5 text-sm">
                          {invoiceData?.invoices?.slice(0, 3).map((inv, idx) => (
                            <li key={inv.id} className="flex items-center justify-between">
                              <span className="text-foreground">{fmtDate(inv.created)}</span>
                              <span className="flex items-center gap-2">
                                <span className="font-semibold">{fmtAmount(inv.amount, inv.currency)}</span>
                                {inv.pdfUrl && (
                                  <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">⬇</a>
                                )}
                              </span>
                            </li>
                          )) || (
                            <>
                              <li className="flex items-center justify-between">
                                <span className="text-foreground">14 may 2026</span>
                                <span className="flex items-center gap-2"><span className="font-semibold">49,00 €</span><button className="text-muted-foreground hover:text-foreground">⬇</button></span>
                              </li>
                              <li className="flex items-center justify-between">
                                <span className="text-foreground">14 abr 2026</span>
                                <span className="flex items-center gap-2"><span className="font-semibold">49,00 €</span><button className="text-muted-foreground hover:text-foreground">⬇</button></span>
                              </li>
                              <li className="flex items-center justify-between">
                                <span className="text-foreground">14 mar 2026</span>
                                <span className="flex items-center gap-2"><span className="font-semibold">49,00 €</span><button className="text-muted-foreground hover:text-foreground">⬇</button></span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ─── 8. SEGURIDAD ─── */}
                <section id="seguridad" className="section scroll-mt-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <header className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Shield className="w-[18px] h-[18px] text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Seguridad</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Contraseña, doble factor y sesiones activas</p>
                    </div>
                  </header>

                  <div className="divide-y divide-border">
                    <div className="px-6 py-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Contraseña</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Última actualización hace 4 meses</p>
                      </div>
                      <button className="h-9 px-4 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted/40">Cambiar contraseña</button>
                    </div>

                    <div className="px-6 py-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">Verificación en dos pasos</p>
                          <TwoFactorSection />
                        </div>
                      </div>
                    </div>

                    {/* Sessions */}
                    <div className="px-6 py-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Sesiones activas</p>
                        <button className="text-xs font-medium text-red-600 hover:underline">Cerrar todas las demás</button>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border">
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                            <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground">MacBook Pro · Chrome</p>
                              <span className="text-[10px] font-semibold text-primary">Este dispositivo</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Madrid, España · ahora mismo</p>
                          </div>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                            <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">iPhone 15 · App Certifive</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Sevilla, España · hace 2 horas</p>
                          </div>
                          <button className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40">Cerrar</button>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                            <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">Windows · Edge</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Madrid, España · hace 3 días</p>
                          </div>
                          <button className="h-8 px-3 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/40">Cerrar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Danger zone */}
                <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Zona de peligro</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">Eliminar tu cuenta es irreversible. Se borrarán expedientes, facturas y datos asociados.</p>
                    </div>
                    <button className="h-10 px-4 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-700 inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/></svg>
                      Eliminar cuenta
                    </button>
                  </div>
                </section>

                <div className="h-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
