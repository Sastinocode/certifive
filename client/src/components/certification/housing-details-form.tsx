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
            <Label htmlFor="facadeOrientation">Orientación de las Fachadas *</Label>
            <Textarea
              id="facadeOrientation"
              name="facadeOrientation"
              rows={3}
              placeholder="Ej: Fachada sur 2 ventanas de las habitaciones cuadradas y puerta al comedor..."
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

          {/* Windows Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Detalles de Ventanas</h4>
              <Button type="button" variant="outline" size="sm" onClick={addWindow}>
                <Plus className="w-4 h-4 mr-1" />
                Añadir Ventana
              </Button>
            </div>
            
            <div className="space-y-4">
              {windows.map((window, index) => (
                <div key={window.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">
                      Ventana {index + 1}
                    </h5>
                    {windows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWindow(window.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Material</Label>
                      <Select
                        value={window.material}
                        onValueChange={(value) => handleWindowChange(window.id, "material", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="madera">Madera</SelectItem>
                          <SelectItem value="aluminio">Aluminio</SelectItem>
                          <SelectItem value="pvc">PVC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tipo de Vidrio</Label>
                      <Select
                        value={window.glassType}
                        onValueChange={(value) => handleWindowChange(window.id, "glassType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="doble">Doble</SelectItem>
                          <SelectItem value="triple">Triple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Caja de Persiana</Label>
                      <Select
                        value={window.hasShutter}
                        onValueChange={(value) => handleWindowChange(window.id, "hasShutter", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="si">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
