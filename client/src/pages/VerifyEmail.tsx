import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verificado correctamente. Ya puedes iniciar sesión.");
        } else {
          setStatus("error");
          setMessage(data.message || "El enlace de verificación no es válido o ha expirado.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Error de conexión. Inténtalo de nuevo más tarde.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card border border-border rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          {status === "loading" && <Loader2 className="w-14 h-14 text-primary animate-spin" />}
          {status === "success" && <CheckCircle className="w-14 h-14 text-primary" />}
          {status === "error" && <XCircle className="w-14 h-14 text-destructive" />}
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {status === "loading" && "Verificando email..."}
          {status === "success" && "¡Email verificado!"}
          {status === "error" && "Verificación fallida"}
        </h1>

        <p className="text-muted-foreground mb-8">{message}</p>

        {status !== "loading" && (
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Ir al inicio de sesión
          </button>
        )}
      </div>
    </div>
  );
}
