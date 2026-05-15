import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from "@/components/ui/file-upload";

interface InstallationsFormProps {
  data: any;
  onDataChange: (data: any) => void;
  certificationId?: string;
}

export default function InstallationsForm({ data, onDataChange, certificationId }: InstallationsFormProps) {
  const handleInputChange = (field: string, value: string | number) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instalaciones y Documentación</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="step-form space-y-6">
          <div>
            <Label htmlFor="airConditioningSystem">Equipos de Climatización *</Label>
            <Select
              name="airConditioningSystem"
              value={data.airConditioningSystem || ""}
              onValueChange={(value) => handleInputChange("airConditioningSystem", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completo">Completo</SelectItem>
                <SelectItem value="split">Split (indicar estancia)</SelectItem>
                <SelectItem value="sin_climatizacion">Sin climatización</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="heatingSystem">Equipos de Calefacción (Radiadores Si/No) *</Label>
            <Select
              name="heatingSystem"
              value={data.heatingSystem || ""}
              onValueChange={(value) => handleInputChange("heatingSystem", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="radiadores_si">Radiadores Sí</SelectItem>
                <SelectItem value="radiadores_no">Radiadores No</SelectItem>
                <SelectItem value="nada">Nada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="waterHeatingType">Equipo de ACS (Calentador) *</Label>
              <Select
                name="waterHeatingType"
                value={data.waterHeatingType || ""}
                onValueChange={(value) => handleInputChange("waterHeatingType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrico">Eléctrico</SelectItem>
                  <SelectItem value="gas_natural">Gas Natural</SelectItem>
                  <SelectItem value="gas_butano">Gas Butano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="waterHeatingCapacity">Capacidad (Litros)</Label>
              <Input
                id="waterHeatingCapacity"
                name="waterHeatingCapacity"
                type="number"
                placeholder="80"
                value={data.waterHeatingCapacity || ""}
                onChange={(e) => handleInputChange("waterHeatingCapacity", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Fotografías de la Fachada</h4>
            <FileUpload 
              certificationId={certificationId}
              onUploadComplete={(photos) => {
                const updatedData = { ...data, photos };
                onDataChange(updatedData);
              }}
              existingPhotos={data.photos || []}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
