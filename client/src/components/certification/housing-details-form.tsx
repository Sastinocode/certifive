import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Window {
  id: string;
  material: string;
  glassType: string;
  hasShutter: string;
  color?: string;
}

interface HousingDetailsFormProps {
  data: any;
  onDataChange: (data: any) => void;
}

export default function HousingDetailsForm({ data, onDataChange }: HousingDetailsFormProps) {
  const [windows, setWindows] = useState<Window[]>(
    data.windows || [{ id: "1", material: "", glassType: "", hasShutter: "" }]
  );

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  const handleWindowChange = (windowId: string, field: string, value: string) => {
    const updatedWindows = windows.map(window => 
      window.id === windowId ? { ...window, [field]: value } : window
    );
    setWindows(updatedWindows);
    
    const updatedData = { ...data, windows: updatedWindows };
    onDataChange(updatedData);
  };

  const addWindow = () => {
    const newWindow: Window = {
      id: Date.now().toString(),
      material: "",
      glassType: "",
      hasShutter: "",
    };
    const updatedWindows = [...windows, newWindow];
    setWindows(updatedWindows);
    
    const updatedData = { ...data, windows: updatedWindows };
    onDataChange(updatedData);
  };

  const removeWindow = (windowId: string) => {
    if (windows.length <= 1) return; // Keep at least one window
    
    const updatedWindows = windows.filter(window => window.id !== windowId);
    setWindows(updatedWindows);
    
    const updatedData = { ...data, windows: updatedWindows };
    onDataChange(updatedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la Vivienda</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="step-form space-y-6">
          <div>
            <Label htmlFor="facadeOrientation">Orientación de las Fachadas y Nº Ventanas en cada Fachada y Estancia *</Label>
            <Textarea
              id="facadeOrientation"
              name="facadeOrientation"
              rows={4}
              placeholder="Ejemplo: Fachada Norte: 2 ventanas (salón y dormitorio) formato cuadrada. O indicar las calles: salón y dormitorio a Calle Alegría, cocina a patio interior paralelo a Calle Alegría, dormitorio 2 y aseo a Calle Muñoz"
              value={data.facadeOrientation || ""}
              onChange={(e) => handleInputChange("facadeOrientation", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="roofType">Tipo de Cubierta *</Label>
            <Select
              name="roofType"
              value={data.roofType || ""}
              onValueChange={(value) => handleInputChange("roofType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plana">Plana</SelectItem>
                <SelectItem value="inclinada">Inclinada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="windowDetails">Material Ventanas, Color, Tipo de Vidrio y Caja de Persiana *</Label>
            <Textarea
              id="windowDetails"
              name="windowDetails"
              rows={4}
              placeholder="Ejemplo: VENTANA 1: MADERA BEIS VIDRIO SIMPLE, CAJA DE PERSIANA NO - VENTANA 2: ALUMINIO BLANCO VIDRIO DOBLE CAJA DE PERSIANA SI"
              value={data.windowDetails || ""}
              onChange={(e) => handleInputChange("windowDetails", e.target.value)}
              required
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
