import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No se encontró el token de verificación en el enlace.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verificado correctamente.");
        } else {
          setStatus("error");
          setMessage(data.message || "El enlace de verificación no es válido o ha caducado.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Error de conexión. Inténtalo de nuevo.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">C5</span>
            </div>
            <span className="text-xl font-black text-emerald-900">certifive</span>
          </div>
          <p className="text-sm text-emerald-700/60">Certificación Energética</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verificando email…</h1>
              <p className="text-sm text-gray-500">Un momento, por favor.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">¡Email verificado!</h1>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
              >
                Iniciar sesión
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
                >
                  Volver al inicio de sesión
                </button>
                <p className="text-xs text-gray-400">
                  Puedes reenviar el email de verificación desde la pantalla de login.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Problemas?{" "}
          <a href="mailto:soporte@certifive.es" className="text-emerald-600 hover:underline">
            soporte@certifive.es
          </a>
        </p>
      </div>
    </div>
  );
}
