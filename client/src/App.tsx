import { Switch, Route, useParams, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OnboardingModal } from "@/components/OnboardingModal";
import Dashboard from "@/pages/dashboard";
import CertificationWizard from "@/pages/certification-wizard";
import CertificationForm from "@/pages/certification-form";
import WhatsAppManagement from "@/pages/whatsapp-management";
import WhatsAppFlowEditor from "@/pages/whatsapp-flow-editor";
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
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import RenovarSuscripcion from "@/pages/RenovarSuscripcion";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-semibold">Cargando...</p>
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
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/solicitar-demo" component={DemoRequest} />

        {/* Home: dashboard if authenticated, landing if not */}
        <Route path="/" component={isAuthenticated ? Dashboard : Landing} />

        {/* Authenticated routes */}
        <Route path="/certificacion/:id?" component={isAuthenticated ? CertificationWizard : Login} />
        <Route path="/certificados/nuevo" component={isAuthenticated ? EnhancedCertificationForm : Login} />
        <Route path="/certificacion-request/:id" component={isAuthenticated ? ViewCertificationRequest : Login} />
        <Route path="/formulario-cee" component={isAuthenticated ? EnhancedCertificationForm : Login} />
        <Route path="/whatsapp" component={isAuthenticated ? WhatsAppManagement : Login} />
        <Route path="/whatsapp-flow-editor" component={isAuthenticated ? WhatsAppFlowEditor : Login} />
        <Route path="/demo-flujo" component={isAuthenticated ? WorkflowDemo : Login} />
        <Route path="/certificados" component={isAuthenticated ? Certificates : Login} />
        <Route path="/propiedades" component={isAuthenticated ? Properties : Login} />
        <Route path="/tarifas" component={isAuthenticated ? Pricing : Login} />
        <Route path="/informes" component={isAuthenticated ? Reports : Login} />
        <Route path="/marketing" component={isAuthenticated ? Marketing : Login} />
        <Route path="/automatizaciones" component={isAuthenticated ? Automations : Login} />
        <Route path="/stripe" component={isAuthenticated ? StripeIntegration : Login} />
        <Route path="/configuracion" component={isAuthenticated ? Settings : Login} />
        <Route path="/settings" component={isAuthenticated ? Settings : Login} />
        <Route path="/revision-tecnica/:id" component={isAuthenticated ? TecnicoFormReview : Login} />
        <Route path="/visita/:id" component={isAuthenticated ? VisitForm : Login} />

        {/* Legal pages */}
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />

        {/* Stripe payment result pages */}
        <Route path="/success" component={PaymentSuccess} />
        <Route path="/cancel" component={PaymentCancel} />
        <Route path="/renovar-suscripcion" component={RenovarSuscripcion} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
