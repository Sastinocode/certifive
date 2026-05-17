import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [done, setDone] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        toast({ title: "Contraseña actualizada", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
      } else {
        toast({ title: data.message || "Error al restablecer la contraseña", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de conexión. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-destructive font-semibold">Enlace de restablecimiento no válido.</p>
          <button onClick={() => navigate("/login")} className="mt-6 text-primary underline text-sm">
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card border border-border rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 rounded-full p-3">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center mb-1">Nueva contraseña</h1>
        <p className="text-muted-foreground text-sm text-center mb-8">
          Introduce tu nueva contraseña para restablecer el acceso.
        </p>

        {done ? (
          <div className="text-center">
            <p className="text-foreground mb-6">¡Contraseña actualizada correctamente!</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-1">Nueva contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-foreground bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-1">Confirmar contraseña</label>
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                required
                placeholder="Repite la contraseña"
                className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-foreground bg-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              {isLoading ? "Guardando..." : "Restablecer contraseña"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline">
                Volver al inicio de sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
