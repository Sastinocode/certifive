import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Shield, TrendingUp, Users, Eye, EyeOff, Chrome, Mail, Lock, User, Building, Phone } from "lucide-react";
import certifiveLogo from "@assets/Logo_1750326352340.jpg";

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    dni: "",
    license: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.dni) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios marcados con *",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambas contraseñas sean idénticas",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor introduce un email válido",
        variant: "destructive",
      });
      return;
    }

    // Validar DNI/NIF español
    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    if (!dniRegex.test(formData.dni) && !nieRegex.test(formData.dni)) {
      toast({
        title: "DNI/NIE inválido",
        description: "Por favor introduce un DNI o NIE válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Bienvenido a CERTIFIVE. Ya puedes comenzar a gestionar tus certificaciones.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Error en el registro:", error);
      toast({
        title: "Error en el registro",
        description: error.message || "No se pudo crear la cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#0D7C66", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: "-.01em" }}>CERTIFIVE</span>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Left side - Benefits */}
        <div className="hidden lg:flex lg:w-1/2" style={{ flexDirection: "column", justifyContent: "center", padding: "80px 64px", borderRight: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0F172A", letterSpacing: "-.02em", marginBottom: 16, lineHeight: 1.2 }}>
              Únete a la plataforma líder en certificación energética
            </h1>
            <p style={{ fontSize: 16, color: "#64748B", marginBottom: 40, lineHeight: 1.6 }}>
              Automatiza tu flujo de trabajo, gestiona clientes y genera certificados profesionales en minutos.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { Icon: Zap, title: "Automatización completa", desc: "Desde WhatsApp hasta entrega final del certificado" },
                { Icon: Shield, title: "Cumplimiento normativo", desc: "Certificados que cumplen toda la normativa española" },
                { Icon: TrendingUp, title: "Gestión financiera", desc: "Control total de pagos, facturas y contabilidad" },
              ].map(({ Icon, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, background: "#e6f4f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color="#0D7C66" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 48px", overflowY: "auto" }}>
          <div style={{ maxWidth: 440, width: "100%", margin: "0 auto" }}>
            <Card className="border-0 shadow-xl" style={{ borderRadius: 8 }}>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Registro Profesional</CardTitle>
                <CardDescription className="text-gray-600">
                  Crea tu cuenta de certificador energético
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Google Sign Up */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignup}
                  className="w-full h-12 border-2 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  <Chrome className="w-5 h-5 mr-3 text-red-500" />
                  <span className="font-medium">Continuar con Google</span>
                </Button>

                <div className="relative">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-3 text-sm text-gray-500">o</span>
                  </div>
                </div>

                {/* Professional Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Datos Personales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos Personales</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          Nombre *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Tu nombre"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="pl-10 h-12"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">
                          Apellidos *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Tus apellidos"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="pl-10 h-12"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dni" className="text-sm font-medium">
                        DNI/NIE *
                      </Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="dni"
                          type="text"
                          placeholder="12345678A o X1234567A"
                          value={formData.dni}
                          onChange={(e) => setFormData({ ...formData, dni: e.target.value.toUpperCase() })}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Profesional *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="certificador@empresa.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Teléfono
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+34 600 123 456"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos Profesionales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos Profesionales</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">
                        Empresa/Despacho
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Nombre de tu empresa"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="license" className="text-sm font-medium">
                        Número de Colegiado/Licencia
                      </Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="license"
                          type="text"
                          placeholder="Ej: COL-1234 o similar"
                          value={formData.license}
                          onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dirección Profesional</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Dirección
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Calle, número, piso, puerta"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          Ciudad
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="Madrid, Barcelona..."
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm font-medium">
                          Código Postal
                        </Label>
                        <Input
                          id="postalCode"
                          type="text"
                          placeholder="28001"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-sm font-medium">
                        Provincia
                      </Label>
                      <Input
                        id="province"
                        type="text"
                        placeholder="Madrid, Barcelona, Valencia..."
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Seguridad</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Contraseña *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pl-10 pr-10 h-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirmar Contraseña *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Repite la contraseña"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 font-medium"
                    style={{ background: "#0D7C66", color: "#fff" }}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear cuenta profesional"
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-600">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="font-medium text-teal-600 hover:text-teal-500 transition-colors"
                  >
                    Iniciar sesión
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Al crear una cuenta, aceptas nuestros{" "}
                  <a href="#" className="underline hover:text-gray-700">
                    Términos de Servicio
                  </a>{" "}
                  y{" "}
                  <a href="#" className="underline hover:text-gray-700">
                    Política de Privacidad
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}