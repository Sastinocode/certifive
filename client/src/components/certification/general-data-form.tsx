import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GeneralDataFormProps {
  data: any;
  onDataChange: (data: any) => void;
}

export default function GeneralDataForm({ data, onDataChange }: GeneralDataFormProps) {
  const handleInputChange = (field: string, value: string | number) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="step-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="dni">DNI del Titular *</Label>
              <Input
                id="dni"
                name="dni"
                type="text"
                placeholder="12345678A"
                value={data.dni || ""}
                onChange={(e) => handleInputChange("dni", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Nombre y apellidos"
                value={data.fullName || ""}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="cadastralRef">Referencia Catastral *</Label>
              <Input
                id="cadastralRef"
                name="cadastralRef"
                type="text"
                placeholder="1234567CD8901E0003RF"
                value={data.cadastralRef || ""}
                onChange={(e) => handleInputChange("cadastralRef", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="968298825"
                value={data.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={data.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="floors">Nº de Plantas Habitables</Label>
              <Input
                id="floors"
                name="floors"
                type="number"
                placeholder="9"
                value={data.floors || ""}
                onChange={(e) => handleInputChange("floors", parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="rooms">Nº de Habitaciones</Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                placeholder="2"
                value={data.rooms || ""}
                onChange={(e) => handleInputChange("rooms", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
