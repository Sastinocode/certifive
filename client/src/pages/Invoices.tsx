import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate, formatCurrency } from "../lib/utils";

interface User {
  dniNif?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  company?: string | null;
}

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    clientName: "", clientDni: "", clientAddress: "",
    amount: "", tax: "21", description: "",
  });

  const { data: invoices, isLoading } = useQuery<any[]>({ queryKey: ["/api/invoices"] });
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/user"] });

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
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowForm(false);
      setForm({ clientName: "", clientDni: "", clientAddress: "", amount: "", tax: "21", description: "" });
    },
  });

  const allInvoices = Array.isArray(invoices) ? invoices : [];
  const totalRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

  const inputClass = "w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none";
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 block mb-1";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Facturación</h1>
          <p className="text-sm text-emerald-700/60 mt-1 font-medium">Gestión de facturas conforme a la normativa española</p>
        </div>
        <button
          data-testid="btn-nueva-factura"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva factura
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total facturas", value: allInvoices.length.toString(), icon: "receipt_long", color: "bg-emerald-800" },
          { label: "Ingresos totales", value: formatCurrency(totalRevenue), icon: "payments", color: "bg-orange-600" },
          { label: "Pendientes de cobro", value: allInvoices.filter(i => i.status === "pending").length.toString(), icon: "pending", color: "bg-violet-600" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-[20px]">{card.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-900 tracking-tight mb-1">{card.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">{card.label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
          <div className="bg-emerald-50 px-8 py-5 border-b border-emerald-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-emerald-900">Nueva factura</h2>
            <button onClick={() => setShowForm(false)} className="text-emerald-700/60 hover:text-emerald-900 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Datos del emisor</p>
                <div className="bg-emerald-50 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-semibold text-emerald-900">{user?.company || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Tu empresa"}</p>
                  <p className="text-xs text-emerald-700/60">NIF: {user?.dniNif || "-"}</p>
                  <p className="text-xs text-emerald-700/60">{user?.address || ""}{user?.city ? `, ${user.city}` : ""}</p>
                  <p className="text-xs text-emerald-700/60">{user?.email || "-"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Datos del cliente</p>
                <div>
                  <label className={labelClass}>Nombre del cliente *</label>
                  <input
                    data-testid="input-clientName"
                    className={inputClass}
                    value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="Nombre completo o razón social"
                  />
                </div>
                <div>
                  <label className={labelClass}>DNI / NIF / CIF</label>
                  <input
                    data-testid="input-clientDni"
                    className={inputClass}
                    value={form.clientDni}
                    onChange={e => setForm(f => ({ ...f, clientDni: e.target.value }))}
                    placeholder="12345678A"
                  />
                </div>
                <div>
                  <label className={labelClass}>Dirección fiscal</label>
                  <input
                    data-testid="input-clientAddress"
                    className={inputClass}
                    value={form.clientAddress}
                    onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-emerald-50 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Descripción del servicio</label>
                <input
                  data-testid="input-description"
                  className={inputClass}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Certificado de eficiencia energética - Vivienda unifamiliar"
                />
              </div>
              <div>
                <label className={labelClass}>IVA (%)</label>
                <select
                  data-testid="select-tax"
                  className={inputClass}
                  value={form.tax}
                  onChange={e => setForm(f => ({ ...f, tax: e.target.value }))}
                >
                  <option value="21">21%</option>
                  <option value="10">10%</option>
                  <option value="4">4%</option>
                  <option value="0">0%</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className={labelClass}>Base imponible (€) *</label>
                <input
                  data-testid="input-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              {form.amount && (
                <div className="md:col-span-2 bg-emerald-50 rounded-xl p-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-emerald-700/60">Base</span>
                      <span className="font-semibold text-emerald-900">{formatCurrency(parseFloat(form.amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700/60">IVA {form.tax}%</span>
                      <span className="font-semibold text-emerald-900">{formatCurrency((parseFloat(form.amount) || 0) * (parseFloat(form.tax) / 100))}</span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
                      <span className="font-bold text-emerald-900">Total</span>
                      <span className="font-bold text-emerald-900">{formatCurrency((parseFloat(form.amount) || 0) * (1 + parseFloat(form.tax) / 100))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                data-testid="btn-create-invoice"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.clientName || !form.amount || createMutation.isPending}
                className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {createMutation.isPending ? "Creando..." : "Crear factura"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto" />
          </div>
        ) : allInvoices.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-400 text-[32px]">receipt_long</span>
            </div>
            <p className="font-semibold text-emerald-900 mb-1">Sin facturas</p>
            <p className="text-sm text-emerald-700/50">Crea tu primera factura haciendo clic en "Nueva factura"</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100/60">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Nº Factura</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Descripción</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Importe</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {allInvoices.map((inv: any) => (
                <tr key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-8 py-5 text-xs font-mono font-bold text-emerald-700">{inv.invoiceNumber}</td>
                  <td className="px-8 py-5">
                    <p className="font-semibold text-emerald-900 text-sm">{inv.clientName}</p>
                    {inv.clientDni && <p className="text-xs text-emerald-700/50">{inv.clientDni}</p>}
                  </td>
                  <td className="px-8 py-5 text-sm text-emerald-700/60 max-w-xs truncate">{inv.description || "-"}</td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-emerald-900">{formatCurrency(inv.totalAmount)}</p>
                    <p className="text-xs text-emerald-700/50">IVA: {formatCurrency(inv.tax)}</p>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-emerald-800">{formatDate(inv.issuedAt)}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Emitida
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
