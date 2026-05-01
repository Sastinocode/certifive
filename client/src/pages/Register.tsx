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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <div className="flex items-center space-x-3">
          <img src={certifiveLogo} alt="CERTIFIVE" className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            CERTIFIVE
          </span>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Left side - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Únete a la plataforma líder en certificación energética
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Automatiza tu flujo de trabajo, gestiona clientes y genera certificados profesionales en minutos.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Automatización completa</h3>
                  <p className="text-gray-600 text-sm">Desde WhatsApp hasta entrega final del certificado</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cumplimiento normativo</h3>
                  <p className="text-gray-600 text-sm">Certificados que cumplen toda la normativa española</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Gestión financiera</h3>
                  <p className="text-gray-600 text-sm">Control total de pagos, facturas y contabilidad</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <Card className="border-0 shadow-2xl">
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
                    className="w-full h-12 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-medium"
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