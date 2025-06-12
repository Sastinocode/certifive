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
            <Label htmlFor="hvacSystem">Equipos de Climatización *</Label>
            <Select
              name="hvacSystem"
              value={data.hvacSystem || ""}
              onValueChange={(value) => handleInputChange("hvacSystem", value)}
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
            <Label htmlFor="heatingSystem">Sistema de Calefacción *</Label>
            <Select
              name="heatingSystem"
              value={data.heatingSystem || ""}
              onValueChange={(value) => handleInputChange("heatingSystem", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="radiadores">Radiadores</SelectItem>
                <SelectItem value="suelo_radiante">Suelo radiante</SelectItem>
                <SelectItem value="sin_calefaccion">Sin calefacción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="waterHeatingType">Equipo ACS (Agua Caliente) *</Label>
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
                  <SelectItem value="gas_natural">Gas natural</SelectItem>
                  <SelectItem value="gas_butano">Gas butano</SelectItem>
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
