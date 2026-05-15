import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.message === "Email verificado correctamente") {
          setStatus("success");
          setMessage("¡Email verificado! Redirigiendo al login...");
          setTimeout(() => navigate("/login"), 2500);
        } else {
          setStatus("error");
          setMessage(data.message ?? "Error al verificar el email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Error de conexión. Inténtalo de nuevo.");
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">
          {status === "loading" && "⏳"}
          {status === "success" && "✅"}
          {status === "error" && "❌"}
        </div>
        <h1 className="text-2xl font-bold text-emerald-900 mb-2">
          {status === "loading" && "Verificando tu email..."}
          {status === "success" && "¡Email verificado!"}
          {status === "error" && "Error de verificación"}
        </h1>
        <p className="text-gray-500 text-sm mt-2">{message}</p>
        {status === "error" && (
          <button
            onClick={() => navigate("/login")}
            className="mt-6 bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-800"
          >
            Ir al login
          </button>
        )}
      </div>
    </div>
  );
}