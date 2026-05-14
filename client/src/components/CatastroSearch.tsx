import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Calendar,
  Ruler,
  Building2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export interface CatastroData {
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  comunidadAutonoma?: string;
  constructionYear?: string;
  totalArea?: string;
  propertyType?: string;
}

interface CatastroSearchProps {
  rc?: string;
  onData?: (data: CatastroData) => void;
  className?: string;
}

export default function CatastroSearch({ rc, onData, className }: CatastroSearchProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [data, setData] = useState<CatastroData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const lookup = async () => {
    const cleanRc = (rc ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
    if (cleanRc.length < 14) {
      setStatus("error");
      setErrorMsg("Referencia catastral demasiado corta (mínimo 14 caracteres)");
      return;
    }
    setStatus("loading");
    setData(null);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/catastro/lookup?rc=${encodeURIComponent(cleanRc)}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setStatus("error");
        setErrorMsg(json.error ?? "Error al consultar el Catastro");
        return;
      }
      setStatus("ok");
      setData(json.data);
    } catch {
      setStatus("error");
      setErrorMsg("No se pudo conectar con el servidor");
    }
  };

  const canSearch = (rc ?? "").replace(/[\s-]/g, "").length >= 14;

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={lookup}
        disabled={!canSearch || status === "loading"}
        className="text-xs"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            Consultando…
          </>
        ) : (
          <>
            <Search className="h-3 w-3 mr-1.5" />
            Consultar Catastro
          </>
        )}
      </Button>

      {status === "error" && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
          <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {status === "ok" && data && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-800">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              Datos encontrados en el Catastro
            </span>
            {onData && (
              <Button
                type="button"
                size="sm"
                onClick={() => onData(data)}
                className="h-6 px-2 text-xs"
              >
                Usar estos datos
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-green-900">
            {data.address && (
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-green-600" />
                <span>{data.address}</span>
              </div>
            )}
            {(data.city || data.postalCode || data.province) && (
              <div className="flex items-start gap-1.5">
                <Building2 className="h-3 w-3 mt-0.5 shrink-0 text-green-600" />
                <span>
                  {[data.postalCode, data.city, data.province]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {data.constructionYear && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-green-600" />
                <span>Construido en {data.constructionYear}</span>
              </div>
            )}
            {data.totalArea && (
              <div className="flex items-center gap-1.5">
                <Ruler className="h-3 w-3 shrink-0 text-green-600" />
                <span>{data.totalArea} m²</span>
              </div>
            )}
            {data.propertyType && (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className="text-xs h-4 px-1.5 font-normal"
                >
                  {data.propertyType}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
