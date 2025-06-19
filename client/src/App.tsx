import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import Settings from "@/pages/settings";
import StripeIntegration from "@/pages/stripe-integration";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import DemoRequest from "@/pages/demo-request";
import PublicQuote from "@/pages/public-quote";
import PublicTariffGenerator from "@/pages/public-tariff-generator";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes (no authentication required) */}
      <Route path="/presupuesto/:uniqueLink" component={PublicQuote} />
      <Route path="/certificacion-cliente/:uniqueLink" component={CertificationForm} />
      <Route path="/generador-tarifas" component={PublicTariffGenerator} />
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Register} />
      <Route path="/solicitar-demo" component={DemoRequest} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/certificacion/:id?" component={CertificationWizard} />
          <Route path="/certificados/nuevo" component={CertificationWizard} />
          <Route path="/certificacion-request/:id" component={ViewCertificationRequest} />
          <Route path="/formulario-cee" component={EnhancedCertificationForm} />
          <Route path="/whatsapp" component={WhatsAppManagement} />
          <Route path="/whatsapp-flow-editor" component={WhatsAppFlowEditor} />
          <Route path="/demo-flujo" component={WorkflowDemo} />
          <Route path="/certificados" component={Certificates} />
          <Route path="/propiedades" component={Properties} />
          <Route path="/tarifas" component={Pricing} />
          <Route path="/informes" component={Reports} />
          <Route path="/configuracion" component={Settings} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
