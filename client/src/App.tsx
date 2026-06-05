import { Switch, Route, useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OnboardingModal } from "@/components/OnboardingModal";
import OnboardingFlow from "@/components/OnboardingFlow";
import { GlobalSearch } from "@/components/GlobalSearch";
import Dashboard from "@/pages/dashboard";
import CertificationWizard from "@/pages/certification-wizard";
import CertificationForm from "@/pages/certification-form";
// WhatsApp API — disponible en plan Pro (próximamente)
function WhatsAppProximo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <span className="text-5xl">📲</span>
      <h2 className="text-xl font-semibold text-gray-800">WhatsApp Business — Próximamente</h2>
      <p className="text-gray-500 max-w-sm text-sm">
        La integración con WhatsApp API estará disponible en el plan Pro.<br />
        Por ahora puedes enviar mensajes manualmente desde cada certificación.
      </p>
    </div>
  );
}
import WorkflowDemo from "@/pages/workflow-demo";
import Certificates from "@/pages/certificates";
import ViewCertificationRequest from "@/pages/view-certification-request";
import EnhancedCertificationForm from "@/pages/enhanced-certification-form";
import Properties from "@/pages/properties";
import Pricing from "@/pages/pricing";
import Reports from "@/pages/reports";
import Marketing from "@/pages/marketing";
import Automations from "@/pages/automations";
import Settings from "@/pages/settings";
import StripeIntegration from "@/pages/stripe-integration";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DemoRequest from "@/pages/demo-request";
import PublicQuote from "@/pages/public-quote";
import PublicPresupuesto from "@/pages/PublicPresupuesto";
import PublicSolicitud from "@/pages/PublicSolicitud";
import PublicCEEForm from "@/pages/PublicCEEForm";
import PublicPayment from "@/pages/PublicPayment";
import PublicTariffGenerator from "@/pages/public-tariff-generator";
import FormularioTecnicoPublico from "@/pages/FormularioTecnicoPublico";
import TecnicoFormReview from "@/pages/TecnicoFormReview";
import VisitForm from "@/pages/VisitForm";
import NotFound from "@/pages/not-found";
import ClientPortal from "@/pages/ClientPortal";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import RenovarSuscripcion from "@/pages/RenovarSuscripcion";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import VerifyEmail from "@/pages/VerifyEmail";
import ResetPassword from "@/pages/ResetPassword";
import RecogidaMovil from "@/pages/RecogidaMovil";
// ── Flujo público de captación (diseño hi-fi) ────────────────────────────────
import PreciosCEE from "@/pages/PreciosCEE";
import SolicitudCEE from "@/pages/SolicitudCEE";
import SolicitudTecnico from "@/pages/SolicitudTecnico";
import SolicitudPresupuesto from "@/pages/SolicitudPresupuesto";
import SolicitudPago from "@/pages/SolicitudPago";
import SolicitudConfirmacion from "@/pages/SolicitudConfirmacion";
import SolicitudSeguimiento from "@/pages/SolicitudSeguimiento";
import SolicitudPagoRechazado from "@/pages/SolicitudPagoRechazado";
import AdminPanel from "@/pages/admin";

function RecogidaMovilWrapper() {
  const { token } = useParams<{ token: string }>();
  return <RecogidaMovil token={token || ""} />;
}

function PresupuestoWrapper() {
  const { token } = useParams<{ token: string }>();
  return <PublicPresupuesto token={token || ""} />;
}

function SolicitudWrapper() {
  const { token } = useParams<{ token: string }>();
  return <PublicSolicitud token={token || ""} />;
}

function CEEFormWrapper() {
  const { token } = useParams<{ token: string }>();
  return <PublicCEEForm token={token || ""} />;
}

function FormularioTecnicoWrapper() {
  const { token } = useParams<{ token: string }>();
  return <FormularioTecnicoPublico token={token || ""} />;
}

function PaymentWrapper() {
  const { token } = useParams<{ token: string }>();
  return <PublicPayment token={token || ""} />;
}

// Pages that are always accessible regardless of subscription status
const SUBSCRIPTION_FREE_PATHS = [
  "/renovar-suscripcion", "/login", "/register", "/success", "/cancel",
  "/solicitar-demo",
];

// Route prefixes where the setup wizard should NOT appear
const SETUP_SKIP_PREFIXES = [
  "/presupuesto/", "/cotizacion/", "/solicitud/", "/formulario-",
  "/pay/", "/certificacion-cliente/", "/generador-tarifas", "/recogida/",
  "/login", "/register", "/verify-email", "/reset-password", "/solicitar-demo",
  "/privacy", "/terms", "/success", "/cancel", "/renovar-suscripcion",
  "/precios", "/solicitud-cee",
];

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  // Fetch subscription status when logged in (soft fail — never blocks render)
  const { data: subData } = useQuery<{ status?: string }>({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users with a blocked subscription to the renewal page
  const subStatus = subData?.status;
  const isBlocked =
    isAuthenticated &&
    subStatus != null &&
    ["canceled", "past_due"].includes(subStatus) &&
    !SUBSCRIPTION_FREE_PATHS.some(p => location.startsWith(p));

  if (isBlocked) {
    return <RenovarSuscripcion />;
  }

  // Show full-screen setup wizard for genuinely new users:
  // - DB flag not yet set (onboardingCompleted === false)
  // - Not a demo account
  // - Not on a public/unauthenticated route
  // - localStorage key absent (guards existing users whose DB flag wasn't set yet)
  const isPublicRoute = SETUP_SKIP_PREFIXES.some(p => location.startsWith(p));
  const hasUsedAppBefore = typeof window !== "undefined"
    && localStorage.getItem("certifive_onboarding_v1_done") !== null;
  const isNewUser =
    isAuthenticated &&
    user?.onboardingCompleted === false &&
    !isPublicRoute &&
    !hasUsedAppBefore &&
    user?.username !== "demo" &&
    user?.email !== "demo@certifive.es";

  if (isNewUser) {
    return (
      <OnboardingFlow
        user={user!}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }}
      />
    );
  }

  return (
    <>
      {isAuthenticated && <OnboardingModal />}
      <Switch>
        {/* Public client-facing routes */}
        <Route path="/presupuesto/:token" component={PresupuestoWrapper} />
        <Route path="/cotizacion/:uniqueLink" component={PublicQuote} />
        <Route path="/solicitud/:token" component={SolicitudWrapper} />
        <Route path="/formulario-cee/:token" component={CEEFormWrapper} />
        <Route path="/formulario-tecnico/:token" component={FormularioTecnicoWrapper} />
        <Route path="/pay/:token" component={PaymentWrapper} />
        <Route path="/certificacion-cliente/:uniqueLink" component={CertificationForm} />
        <Route path="/generador-tarifas" component={PublicTariffGenerator} />
        <Route path="/recogida/:token" component={RecogidaMovilWrapper} />
        {/* ── Flujo público de captación CEE ──────────────────────────────── */}
        <Route path="/precios" component={PreciosCEE} />
        <Route path="/solicitud-cee" component={SolicitudCEE} />
        <Route path="/solicitud-cee/tecnico" component={SolicitudTecnico} />
        <Route path="/solicitud-cee/presupuesto" component={SolicitudPresupuesto} />
        <Route path="/solicitud-cee/pago" component={SolicitudPago} />
        <Route path="/solicitud-cee/confirmacion" component={SolicitudConfirmacion} />
        <Route path="/solicitud-cee/seguimiento" component={SolicitudSeguimiento} />
        <Route path="/solicitud-cee/pago-rechazado" component={SolicitudPagoRechazado} />

        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/solicitar-demo" component={DemoRequest} />

        {/* Home: dashboard if authenticated, landing if not */}
        {/* Dashboard tiene onNavigate opcional — lambda para compatibilidad con Wouter RouteComponentProps */}
        <Route path="/" component={isAuthenticated ? () => <Dashboard /> : Landing} />

        {/* Authenticated routes */}
        <Route path="/certificacion/:id?" component={isAuthenticated ? CertificationWizard : Login} />
        <Route path="/certificados/nuevo" component={isAuthenticated ? EnhancedCertificationForm : Login} />
        <Route path="/certificacion-request/:id" component={isAuthenticated ? ViewCertificationRequest : Login} />
        <Route path="/formulario-cee" component={isAuthenticated ? EnhancedCertificationForm : Login} />
        <Route path="/portal/:token" component={ClientPortal} />
        <Route path="/whatsapp" component={isAuthenticated ? WhatsAppProximo : Login} />
        <Route path="/demo-flujo" component={isAuthenticated ? WorkflowDemo : Login} />
        <Route path="/certificados" component={isAuthenticated ? Certificates : Login} />
        <Route path="/propiedades" component={isAuthenticated ? Properties : Login} />
        <Route path="/tarifas" component={isAuthenticated ? Pricing : Login} />
        <Route path="/informes" component={isAuthenticated ? Reports : Login} />
        <Route path="/marketing" component={isAuthenticated ? Marketing : Login} />
        <Route path="/automatizaciones" component={isAuthenticated ? Automations : Login} />
        <Route path="/stripe" component={isAuthenticated ? StripeIntegration : Login} />
        <Route path="/configuracion" component={isAuthenticated ? Settings : Login} />
        <Route path="/admin" component={isAuthenticated ? AdminPanel : Login} />
        <Route path="/revision-tecnica/:id" component={isAuthenticated ? TecnicoFormReview : Login} />
        <Route path="/visita/:id" component={isAuthenticated ? VisitForm : Login} />

        {/* Legal pages */}
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />

        {/* Stripe payment result pages */}
        <Route path="/success" component={PaymentSuccess} />
        <Route path="/cancel" component={PaymentCancel} />
        <Route path="/renovar-suscripción" component={RenovarSuscripcion} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// ── Global Ctrl+K search wrapper ─────────────────────────────────────────────
function AppWithSearch() {
  const { isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isAuthenticated) setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAuthenticated]);

  return (
    <>
      <Router />
      {isAuthenticated && searchOpen && (
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      }
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppWithSearch />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
