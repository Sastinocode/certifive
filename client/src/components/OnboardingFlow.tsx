/**
 * OnboardingFlow — pantalla única de bienvenida.
 * Solo pide los datos mínimos para empezar:
 *   nombre, apellidos, empresa (opcional), teléfono, DNI/NIF.
 * Pagos y certificación de prueba se configuran después desde Ajustes.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingFlowProps {
  user: {
    id: number;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    phone?: string | null;
    licenseNumber?: string | null;
  };
  onComplete: () => void;
}

const lc = "block text-xs font-bold uppercase tracking-wider text-emerald-800/70 mb-1";
const ic = "w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900 placeholder:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition";

export default function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    firstName:     user.firstName ?? user.name ?? "",
    lastName:      user.lastName  ?? "",
    company:       user.company   ?? "",
    phone:         user.phone     ?? "",
    licenseNumber: user.licenseNumber ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/auth/user", {
        firstName:     form.firstName.trim(),
        lastName:      form.lastName.trim(),
        name:          `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        company:       form.company.trim() || null,
        phone:         form.phone.trim()   || null,
        licenseNumber: form.licenseNumber.trim() || null,
      });
      await apiRequest("PATCH", "/api/auth/onboarding/complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: () => {
      toast({ title: "Error al guardar", description: "Inténtalo de nuevo.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">

      {/* Header */}
      <div className="flex-shrink-0 bg-emerald-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[16px]">energy_savings_leaf</span>
        </div>
        <span className="text-white font-black text-sm tracking-tight">CERTIFIVE</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-2xl font-black text-emerald-900 tracking-tight">
              Bienvenido 👋
            </h1>
            <p className="text-emerald-700/60 text-sm mt-1 leading-relaxed">
              Rellena estos datos para empezar. Puedes cambiarlos cuando quieras desde Ajustes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Nombre <span className="text-orange-500">*</span></label>
                <input
                  className={ic}
                  placeholder="Juan"
                  value={form.firstName}
                  onChange={set("firstName")}
                  autoFocus
                />
              </div>
              <div>
                <label className={lc}>Apellidos</label>
                <input
                  className={ic}
                  placeholder="García López"
                  value={form.lastName}
                  onChange={set("lastName")}
                />
              </div>
            </div>

            <div>
              <label className={lc}>Empresa <span className="text-emerald-400 font-normal normal-case">(opcional)</span></label>
              <input
                className={ic}
                placeholder="Tu empresa o autónomo"
                value={form.company}
                onChange={set("company")}
              />
            </div>

            <div>
              <label className={lc}>Teléfono</label>
              <input
                className={ic}
                placeholder="600 000 000"
                value={form.phone}
                onChange={set("phone")}
                type="tel"
              />
            </div>

            <div>
              <label className={lc}>DNI / NIF</label>
              <input
                className={ic}
                placeholder="12345678A"
                value={form.licenseNumber}
                onChange={set("licenseNumber")}
              />
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm tracking-wide"
            >
              {saveMutation.isPending ? "Guardando…" : "Empezar →"}
            </button>

          </form>
        </div>
      </div>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-50 rounded-full opacity-60" />
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-50 rounded-full opacity-40" />
      </div>

    </div>
  );
}
