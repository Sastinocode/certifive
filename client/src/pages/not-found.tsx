import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <p className="text-6xl font-bold text-gray-200 mb-2">404</p>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-500 mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    </div>
  );
}
