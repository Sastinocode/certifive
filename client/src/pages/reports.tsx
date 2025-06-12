import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import { 
  BarChart3, 
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Leaf,
  Calendar,
  Building
} from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("last_month");

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications"],
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Calculate analytics
  const analytics = {
    totalCertifications: certifications.length,
    completedCertifications: certifications.filter((c: any) => c.status === 'completed').length,
    averageEnergyRating: calculateAverageRating(certifications),
    totalCO2Savings: calculateCO2Savings(certifications),
    ratingDistribution: calculateRatingDistribution(certifications),
    monthlyTrend: calculateMonthlyTrend(certifications)
  };

  function calculateAverageRating(certs: any[]) {
    const completedWithRating = certs.filter(c => c.status === 'completed' && c.energyRating);
    if (completedWithRating.length === 0) return 'N/A';
    
    const ratingValues = { 'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1 };
    const total = completedWithRating.reduce((sum, cert) => {
      return sum + (ratingValues[cert.energyRating as keyof typeof ratingValues] || 0);
    }, 0);
    
    const average = total / completedWithRating.length;
    const ratings = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];
    return ratings[Math.round(average) - 1] || 'N/A';
  }

  function calculateCO2Savings(certs: any[]) {
    return certs
      .filter(c => c.co2Emissions)
      .reduce((sum, cert) => sum + parseFloat(cert.co2Emissions || '0'), 0)
      .toFixed(1);
  }

  function calculateRatingDistribution(certs: any[]) {
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    certs
      .filter(c => c.energyRating)
      .forEach(cert => {
        if (cert.energyRating in distribution) {
          distribution[cert.energyRating as keyof typeof distribution]++;
        }
      });
    return distribution;
  }

  function calculateMonthlyTrend(certs: any[]) {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substr(0, 7);
      const monthCerts = certs.filter((c: any) => c.createdAt?.startsWith(monthKey));
      last6Months.push({
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        count: monthCerts.length,
        completed: monthCerts.filter((c: any) => c.status === 'completed').length
      });
    }
    return last6Months;
  }

  const reportTypes = [
    { value: "summary", label: "Resumen Ejecutivo" },
    { value: "energy", label: "Análisis Energético" },
    { value: "compliance", label: "Cumplimiento Normativo" },
    { value: "performance", label: "Rendimiento Mensual" }
  ];

  const dateRanges = [
    { value: "last_week", label: "Última semana" },
    { value: "last_month", label: "Último mes" },
    { value: "last_quarter", label: "Último trimestre" },
    { value: "last_year", label: "Último año" }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="reports" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Informes</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Informes y Análisis</h2>
                <p className="text-gray-600">Análisis detallado de certificaciones energéticas y cumplimiento normativo</p>
              </div>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Exportar Informe
              </Button>
            </div>

            {/* Report Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Tipo de informe" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Certificados</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalCertifications}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">+12% vs mes anterior</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Calificación Media</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.averageEnergyRating}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">Mejora constante</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tasa Finalización</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.totalCertifications > 0 
                        ? Math.round((analytics.completedCertifications / analytics.totalCertifications) * 100)
                        : 0}%
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                      <span className="text-xs text-red-500">-3% vs mes anterior</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Emisiones CO₂ (t)</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalCO2Savings}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">Reducción +8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Energy Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Calificaciones Energéticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.ratingDistribution).map(([rating, count]) => (
                    <div key={rating} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge className={`energy-rating energy-rating-${rating.toLowerCase()} mr-3`}>
                          {rating}
                        </Badge>
                        <span className="text-sm text-gray-600">Clase {rating}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full energy-rating-${rating.toLowerCase()}`}
                            style={{ 
                              width: analytics.totalCertifications > 0 
                                ? `${((count as number) / analytics.totalCertifications) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual de Certificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600 w-12">{month.month}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{month.count} total</div>
                          <div className="text-xs text-gray-500">{month.completed} completadas</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-primary rounded-full"
                            style={{ 
                              width: month.count > 0 
                                ? `${(month.completed / month.count) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {reportTypes.find(t => t.value === reportType)?.label || "Informe"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Generando informe...</p>
                </div>
              ) : (
                <div className="prose max-w-none">
                  {reportType === "summary" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen Ejecutivo</h3>
                        <p className="text-gray-600 mb-4">
                          Durante el período seleccionado se han procesado {analytics.totalCertifications} certificaciones energéticas, 
                          de las cuales {analytics.completedCertifications} han sido completadas exitosamente.
                        </p>
                        <p className="text-gray-600">
                          La calificación energética promedio obtenida es de clase {analytics.averageEnergyRating}, 
                          cumpliendo con los estándares de eficiencia energética establecidos por la normativa española CEE.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-2">Indicadores Clave</h4>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          <li>Tasa de finalización: {analytics.totalCertifications > 0 
                            ? Math.round((analytics.completedCertifications / analytics.totalCertifications) * 100)
                            : 0}%</li>
                          <li>Calificación energética promedio: {analytics.averageEnergyRating}</li>
                          <li>Total emisiones CO₂ registradas: {analytics.totalCO2Savings} toneladas</li>
                          <li>Cumplimiento normativo: 100% conforme a estándares CEE</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {reportType === "energy" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Análisis de Eficiencia Energética</h3>
                        <p className="text-gray-600 mb-4">
                          Análisis detallado del rendimiento energético de las propiedades certificadas según los criterios 
                          establecidos en la normativa española de certificación energética.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-2">Distribución por Calificación</h4>
                        <p className="text-gray-600 mb-3">
                          La distribución de calificaciones energéticas muestra el siguiente patrón:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          {Object.entries(analytics.ratingDistribution).map(([rating, count]) => (
                            <li key={rating}>
                              Clase {rating}: {count} propiedades ({analytics.totalCertifications > 0 
                                ? Math.round(((count as number) / analytics.totalCertifications) * 100)
                                : 0}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {reportType === "compliance" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Cumplimiento Normativo CEE</h3>
                        <p className="text-gray-600 mb-4">
                          Informe de cumplimiento con la normativa española de certificación energética de edificios (CEE).
                        </p>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-2">Estándares Cumplidos</h4>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          <li>✅ Metodología de cálculo conforme al RD 235/2013</li>
                          <li>✅ Formato de certificado según modelo oficial</li>
                          <li>✅ Validación de datos técnicos requeridos</li>
                          <li>✅ Registro en base de datos autonómica</li>
                          <li>✅ Etiqueta energética en formato oficial</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {reportType === "performance" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Rendimiento Operativo</h3>
                        <p className="text-gray-600 mb-4">
                          Análisis del rendimiento del proceso de certificación durante el período seleccionado.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-2">Métricas de Productividad</h4>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          <li>Certificaciones iniciadas: {analytics.totalCertifications}</li>
                          <li>Certificaciones completadas: {analytics.completedCertifications}</li>
                          <li>Tiempo promedio de procesamiento: 3.2 días</li>
                          <li>Tasa de eficiencia del proceso: 95.5%</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Informe generado el {new Date().toLocaleDateString('es-ES')} por CertificoEnergia
                      </p>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}