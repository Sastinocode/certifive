import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate, formatCurrency } from "../lib/utils";

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    clientName: "", clientDni: "", clientAddress: "",
    amount: "", tax: "21", description: "",
  });

  const { data: invoices, isLoading } = useQuery({ queryKey: ["/api/invoices"] });
  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const amount = parseFloat(data.amount);
      const taxRate = parseFloat(data.tax) / 100;
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;
      return apiRequest("POST", "/api/invoices", { ...data, amount, tax: taxAmount, totalAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowForm(false);
      setForm({ clientName: "", clientDni: "", clientAddress: "", amount: "", tax: "21", description: "" });
    },
  });

  const allInvoices = Array.isArray(invoices) ? invoices : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de facturas y cobros</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Nueva factura
        </button>
      </div>

      {user && (
        <div className={`mb-6 rounded-2xl border p-4 ${
          user.dniNif && user.firstName && user.email
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{user.dniNif && user.firstName && user.email ? "✅" : "⚠️"}</span>
            <div>
              <p className={`font-medium text-sm ${user.dniNif && user.firstName && user.email ? "text-green-900" : "text-yellow-900"}`}>
                {user.dniNif && user.firstName && user.email
                  ? "Perfil profesional completo - Facturas legalmente válidas"
                  : "Completa tu perfil profesional para facturas legalmente válidas"}
              </p>
              <p className={`text-xs mt-0.5 ${user.dniNif && user.firstName && user.email ? "text-green-700" : "text-yellow-700"}`}>
                {user.dniNif && user.firstName && user.email
                  ? `${user.firstName} ${user.lastName || ""} · DNI/NIF: ${user.dniNif}`
                  : "Ve a Configuración → Perfil profesional para añadir DNI/NIF y datos completos"}
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Nueva factura</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre del cliente</label>
                <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">DNI/NIF del cliente</label>
                <input type="text" value={form.clientDni} onChange={e => setForm(f => ({ ...f, clientDni: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="12345678A" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Dirección del cliente</label>
                <input type="text" value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="Dirección completa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Importe (€)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">IVA (%)</label>
                  <select value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500">
                    <option value="21">21%</option>
                    <option value="10">10%</option>
                    <option value="4">4%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>
              {form.amount && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Base imponible</span>
                    <span>{formatCurrency(parseFloat(form.amount))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>IVA ({form.tax}%)</span>
                    <span>{formatCurrency(parseFloat(form.amount) * parseFloat(form.tax) / 100)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 mt-2 pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(form.amount) * (1 + parseFloat(form.tax) / 100))}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.clientName || !form.amount} className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {createMutation.isPending ? "Creando..." : "Crear factura"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div></div>
        ) : allInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-gray-500 font-medium">No hay facturas</p>
            <p className="text-gray-400 text-sm mt-1">Crea tu primera factura con el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Factura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IVA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm">{inv.clientName || "-"}</div>
                      <div className="text-gray-400 text-xs">{inv.clientDni || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(inv.tax)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === "paid" ? "bg-green-100 text-green-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {inv.status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(inv.issuedAt || inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
