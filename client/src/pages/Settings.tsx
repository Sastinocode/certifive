import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";

// ─── Shared primitives ────────────────────────────────────────────────────────

const ic  = "w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none text-emerald-900 placeholder:text-emerald-500/40";
const lc  = "text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 block mb-1.5";
const card = "bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-emerald-700" : "bg-emerald-200"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-emerald-700 text-sm font-medium transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
      <span className="material-symbols-outlined text-[16px]">check_circle</span>
      Cambios guardados
    </span>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-emerald-50 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        {typeof children === "object" && "toggle" in (children as any) ? null : (
          <p className="text-sm font-semibold text-emerald-900">{label}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function NotifRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-emerald-50 last:border-0 gap-4">
      <div>
        <p className="text-sm font-semibold text-emerald-900">{label}</p>
        <p className="text-xs text-emerald-700/50 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Image upload helper ──────────────────────────────────────────────────────

function ImageUpload({ label, value, endpoint, onUploaded, shape = "circle" }: {
  label: string;
  value?: string | null;
  endpoint: string;
  onUploaded: (url: string) => void;
  shape?: "circle" | "rect";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { setPreview(value ?? null); }, [value]);

  const handle = async (file: File) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) { setErr("Solo PNG/JPG"); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("Máximo 2 MB"); return; }
    setErr("");
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.append(endpoint.includes("logo") ? "logo" : "firma", file);
    setUploading(true);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onUploaded(data.url);
    } catch (e: any) { setErr(e.message ?? "Error al subir"); }
    finally { setUploading(false); }
  };

  const shapeClass = shape === "circle"
    ? "w-24 h-24 rounded-full"
    : "w-40 h-20 rounded-xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => ref.current?.click()}
        className={`${shapeClass} bg-emerald-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-emerald-200 relative`}
      >
        {preview
          ? <img src={preview} alt={label} className="w-full h-full object-cover" />
          : <span className="material-symbols-outlined text-emerald-400 text-[32px]">
              {shape === "circle" ? "account_circle" : "draw"}
            </span>
        }
        {uploading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <button onClick={() => ref.current?.click()} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">
        {preview ? "Cambiar" : "Subir"} {label.toLowerCase()}
      </button>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept="image/png,image/jpeg" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Perfil profesional
// ══════════════════════════════════════════════════════════════════════════════

function PerfilTab({ user }: { user: any }) {
  const [f, setF] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && !f) setF({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      company: user.company || "",
      commercialName: user.commercialName || "",
      dniNif: user.dniNif || "",
      licenseNumber: user.licenseNumber || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
      province: user.province || "",
      iban: user.iban || "",
      emailSignature: user.emailSignature || "",
    });
  }, [user]);

  const mut = useMutation({
    mutationFn: (d: any) => apiRequest("PUT", "/api/auth/user", d),
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/user"], updated);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user/completeness"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!f) return null;
  const set = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Avatar + logo + firma */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Imagen de perfil, logo y firma</p>
        <div className="flex flex-wrap gap-8 items-start">
          <ImageUpload label="Logo" value={user.logoUrl} endpoint="/api/auth/user/logo"
            onUploaded={url => { queryClient.setQueryData(["/api/auth/user"], (u: any) => ({ ...u, logoUrl: url })); queryClient.invalidateQueries({ queryKey: ["/api/auth/user/completeness"] }); }} shape="circle" />
          <ImageUpload label="Firma digital" value={user.firmaUrl} endpoint="/api/auth/user/firma"
            onUploaded={url => queryClient.setQueryData(["/api/auth/user"], (u: any) => ({ ...u, firmaUrl: url }))} shape="rect" />
          <div className="text-xs text-emerald-700/50 max-w-xs leading-relaxed">
            <p className="font-semibold text-emerald-700 mb-1">Uso en documentos</p>
            <p>El <strong>logo</strong> aparece en presupuestos y facturas. La <strong>firma digital</strong> se incluye en los certificados CEE generados.</p>
            <p className="mt-1.5">Formatos: PNG o JPG — Máx. 2 MB</p>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Datos de identidad profesional</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lc}>Nombre *</label><input className={ic} value={f.firstName} onChange={e => set("firstName", e.target.value)} placeholder="María" /></div>
          <div><label className={lc}>Apellidos *</label><input className={ic} value={f.lastName} onChange={e => set("lastName", e.target.value)} placeholder="García López" /></div>
          <div><label className={lc}>Empresa / Razón social</label><input className={ic} value={f.company} onChange={e => set("company", e.target.value)} placeholder="Certificaciones Energéticas S.L." /></div>
          <div><label className={lc}>Nombre comercial <span className="normal-case font-normal">(si es diferente)</span></label><input className={ic} value={f.commercialName} onChange={e => set("commercialName", e.target.value)} placeholder="Certificados Madrid" /></div>
          <div>
            <label className={lc}>DNI / NIF</label>
            <input className={ic} value={f.dniNif} onChange={e => set("dniNif", e.target.value)} placeholder="12345678A"
              pattern="[0-9]{8}[A-Z]|[A-Z][0-9]{7}[A-Z0-9]" />
          </div>
          <div><label className={lc}>Nº habilitación / colegiado</label><input className={ic} value={f.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} placeholder="CEE-2024-001" /></div>
        </div>
      </div>

      {/* Contact */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Contacto y dirección fiscal</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lc}>Email *</label><input type="email" className={ic} value={f.email} onChange={e => set("email", e.target.value)} placeholder="maria@certificados.com" /></div>
          <div><label className={lc}>Teléfono *</label><input type="tel" className={ic} value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="+34 600 000 000" /></div>
          <div className="md:col-span-2"><label className={lc}>Dirección</label><input className={ic} value={f.address} onChange={e => set("address", e.target.value)} placeholder="Calle Mayor 1, 1º A" /></div>
          <div><label className={lc}>Ciudad</label><input className={ic} value={f.city} onChange={e => set("city", e.target.value)} placeholder="Madrid" /></div>
          <div><label className={lc}>Código postal</label><input className={ic} value={f.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="28001" /></div>
          <div className="md:col-span-2"><label className={lc}>Provincia / Comunidad autónoma</label><input className={ic} value={f.province} onChange={e => set("province", e.target.value)} placeholder="Madrid" /></div>
        </div>
      </div>

      {/* IBAN */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Cuenta bancaria para cobros</p>
        <label className={lc}>IBAN <span className="normal-case font-normal">(opcional — para transferencias de clientes)</span></label>
        <input className={`${ic} font-mono tracking-wider`} value={f.iban} onChange={e => set("iban", e.target.value.toUpperCase())} placeholder="ES00 0000 0000 0000 0000 0000" />
      </div>

      {/* Email signature */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Firma de email</p>
        <label className={lc}>Texto de cierre en tus emails</label>
        <textarea rows={3} className={`${ic} resize-none`} value={f.emailSignature}
          onChange={e => set("emailSignature", e.target.value)}
          placeholder={`Un saludo,\n${f.firstName || "Tu nombre"} — ${f.company || "Tu empresa"}`} />
        <p className="text-xs text-emerald-700/40 mt-1.5">Se añade automáticamente al pie de todos los emails enviados a clientes.</p>
      </div>

      <div className="flex items-center justify-end gap-4">
        <SavedBadge show={saved} />
        <button onClick={() => mut.mutate(f)} disabled={mut.isPending}
          className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm">
          {mut.isPending ? "Guardando…" : "Guardar perfil"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Pagos y facturación
// ══════════════════════════════════════════════════════════════════════════════

const ALL_PAY_METHODS = [
  { key: "stripe",        icon: "💳", label: "Tarjeta bancaria (Stripe)" },
  { key: "bizum",         icon: "🟣", label: "Bizum" },
  { key: "transferencia", icon: "🏦", label: "Transferencia bancaria" },
  { key: "efectivo",      icon: "💵", label: "Efectivo" },
];

function PagosTab({ user }: { user: any }) {
  const [f, setF] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && !f) setF({
      tramo1Percent:                user.tramo1Percent ?? 25,
      blockFormUntilPayment1:       user.blockFormUntilPayment1 ?? false,
      blockCertificateUntilPayment2: user.blockCertificateUntilPayment2 ?? false,
      paymentReminderDays:          user.paymentReminderDays ?? 3,
      enabledPaymentMethods:        user.enabledPaymentMethods ?? ["stripe", "bizum", "transferencia", "efectivo"],
      bizumPhone:                   user.bizumPhone || "",
      iban:                         user.iban || "",
      invoiceSeriesPrefix:          user.invoiceSeriesPrefix || "FAC",
      invoiceNextNumber:            user.invoiceNextNumber ?? 1,
      ivaPercent:                   user.ivaPercent ?? "21",
      publicSlug:                   user.publicSlug || "",
      condicionesServicio:          user.condicionesServicio || "",
      plazoEntregaDias:             user.plazoEntregaDias ?? 10,
    });
  }, [user]);

  const mut = useMutation({
    mutationFn: (d: any) => apiRequest("PUT", "/api/auth/user/settings", d),
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/user"], (u: any) => ({ ...u, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!f) return null;
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggleMethod = (key: string) => set("enabledPaymentMethods",
    (f.enabledPaymentMethods as string[]).includes(key)
      ? f.enabledPaymentMethods.filter((m: string) => m !== key)
      : [...f.enabledPaymentMethods, key]);

  return (
    <div className="space-y-6">
      {/* Tramo split */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Fraccionamiento del pago</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={lc}>Primer pago (% del total)</label>
              <span className="text-sm font-bold text-emerald-800">{f.tramo1Percent}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={f.tramo1Percent}
              onChange={e => set("tramo1Percent", parseInt(e.target.value))} className="w-full accent-emerald-700" />
            <div className="flex justify-between text-[10px] text-emerald-700/40 mt-1">
              <span>10%</span>
              <span className="font-semibold text-emerald-600">Segundo pago: {100 - f.tramo1Percent}%</span>
              <span>100% (pago único)</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-emerald-50">
            <div><p className="text-sm font-semibold text-emerald-900">Bloquear formulario CEE hasta pago 1</p><p className="text-xs text-emerald-700/50 mt-0.5">El cliente no puede rellenar el formulario antes de confirmar el primer pago.</p></div>
            <Toggle checked={f.blockFormUntilPayment1} onChange={() => set("blockFormUntilPayment1", !f.blockFormUntilPayment1)} />
          </div>
          <div className="flex items-center justify-between py-3 border-t border-emerald-50">
            <div><p className="text-sm font-semibold text-emerald-900">Bloquear entrega hasta pago 2</p><p className="text-xs text-emerald-700/50 mt-0.5">El certificado final no se entrega hasta confirmar el segundo pago.</p></div>
            <Toggle checked={f.blockCertificateUntilPayment2} onChange={() => set("blockCertificateUntilPayment2", !f.blockCertificateUntilPayment2)} />
          </div>
          <div className="border-t border-emerald-50 pt-4">
            <label className={lc}>Recordatorio automático de pago (días)</label>
            <div className="flex gap-2 flex-wrap mt-1.5">
              {[1, 2, 3, 5, 7].map(d => (
                <button key={d} onClick={() => set("paymentReminderDays", d)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${f.paymentReminderDays === d ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-100 text-emerald-700 hover:border-emerald-300"}`}>
                  {d}d
                </button>
              ))}
            </div>
            <p className="text-xs text-emerald-700/40 mt-1.5">Se enviará un recordatorio si el pago no se confirma en este plazo.</p>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Métodos de pago aceptados</p>
        <div className="space-y-3 mb-5">
          {ALL_PAY_METHODS.map(m => (
            <label key={m.key} className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => toggleMethod(m.key)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${(f.enabledPaymentMethods as string[]).includes(m.key) ? "bg-emerald-700 border-emerald-700" : "border-emerald-200"}`}>
                {(f.enabledPaymentMethods as string[]).includes(m.key) && <span className="text-white text-[11px] font-black">✓</span>}
              </div>
              <span className="text-base">{m.icon}</span>
              <span className="text-sm font-medium text-emerald-900">{m.label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4">
          <div><label className={lc}>Teléfono Bizum</label><input className={ic} value={f.bizumPhone} onChange={e => set("bizumPhone", e.target.value)} placeholder="+34 600 000 000" /></div>
          <div><label className={lc}>IBAN</label><input className={`${ic} font-mono tracking-wider`} value={f.iban} onChange={e => set("iban", e.target.value.toUpperCase())} placeholder="ES00 0000 0000 0000 0000 0000" /></div>
        </div>
      </div>

      {/* Invoices */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Configuración de facturas</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={lc}>Serie de facturas</label>
            <input className={ic} value={f.invoiceSeriesPrefix} onChange={e => set("invoiceSeriesPrefix", e.target.value.toUpperCase())} placeholder="FAC" />
            <p className="text-xs text-emerald-700/40 mt-1">Las facturas se numerarán como: {f.invoiceSeriesPrefix || "FAC"}-2026-001</p>
          </div>
          <div>
            <label className={lc}>Próximo nº</label>
            <input type="number" min={1} className={ic} value={f.invoiceNextNumber} onChange={e => set("invoiceNextNumber", parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label className={lc}>IVA aplicable (%)</label>
            <input type="number" min={0} max={100} step={0.5} className={ic} value={f.ivaPercent} onChange={e => set("ivaPercent", e.target.value)} />
          </div>
          <div>
            <label className={lc}>Plazo de entrega (días laborables)</label>
            <input type="number" min={1} max={60} className={ic} value={f.plazoEntregaDias} onChange={e => set("plazoEntregaDias", parseInt(e.target.value) || 10)} />
          </div>
        </div>
      </div>

      {/* Public page */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Página pública de captación</p>
        <div className="space-y-4">
          <div>
            <label className={lc}>Slug de URL pública</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-700/60 font-medium whitespace-nowrap">{window.location.origin}/c/</span>
              <input className={ic} value={f.publicSlug}
                onChange={e => set("publicSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="mi-empresa-cee" />
            </div>
            <p className="text-xs text-emerald-700/40 mt-1">Solo letras minúsculas, números y guiones.</p>
          </div>
          <div>
            <label className={lc}>Condiciones del servicio</label>
            <textarea rows={3} className={`${ic} resize-none`} value={f.condicionesServicio}
              onChange={e => set("condicionesServicio", e.target.value)}
              placeholder="Describe las condiciones de tu servicio, plazos, política de cancelación…" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <SavedBadge show={saved} />
        <button onClick={() => mut.mutate(f)} disabled={mut.isPending}
          className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm">
          {mut.isPending ? "Guardando…" : "Guardar configuración de pagos"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Comunicaciones (WhatsApp + email)
// ══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_LABELS: Record<number, string> = {
  1: "Formulario de tasación (inicial)", 2: "Recordatorio tasación (48 h)",
  3: "Presupuesto listo", 4: "Confirmación de pago", 5: "Formulario CEE",
  6: "Recordatorio CEE (72 h)", 7: "Solicitud pago final", 8: "Entrega del certificado",
};
const PLACEHOLDERS = ["[nombre]", "[nombre_certificador]", "[precio]", "[link_formulario_tasacion]", "[link_presupuesto]", "[link_formulario_cee]", "[link_pago_tramo2]"];

function ComunicacionesTab({ user }: { user: any }) {
  const { data: waStatus, refetch: refetchWA } = useQuery<any>({ queryKey: ["/api/whatsapp/status"] });
  const { data: templates, refetch: refetchTpls } = useQuery<any[]>({ queryKey: ["/api/whatsapp/templates"] });

  const [showConnect, setShowConnect] = useState(false);
  const [connectStep, setConnectStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [phone, setPhone] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState("");
  const [editingTipo, setEditingTipo] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [savingTpl, setSavingTpl] = useState(false);
  const sgActive = !!process.env.SENDGRID_API_KEY;

  const disconnectMut = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/whatsapp/disconnect"),
    onSuccess: () => refetchWA(),
  });

  const connect = async () => {
    setConnecting(true); setConnectErr("");
    try {
      await apiRequest("POST", "/api/whatsapp/connect", { apiKey: apiKey.trim(), phone: phone.trim() || undefined });
      setShowConnect(false); setApiKey(""); setPhone(""); setConnectStep(1);
      refetchWA();
    } catch (e: any) { setConnectErr(e?.message ?? "API key inválida."); }
    finally { setConnecting(false); }
  };

  const saveTpl = async (tipo: number, contenido: string) => {
    setSavingTpl(true);
    try { await apiRequest("PUT", `/api/whatsapp/templates/${tipo}`, { contenido }); refetchTpls(); setEditingTipo(null); }
    finally { setSavingTpl(false); }
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp connect modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-green-50 px-6 py-5 flex items-center justify-between border-b border-green-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div><h3 className="text-base font-bold text-emerald-900">Conectar WhatsApp Business</h3><p className="text-xs text-emerald-700/60">Paso {connectStep} de 2</p></div>
              </div>
              <button onClick={() => { setShowConnect(false); setConnectStep(1); }} className="text-emerald-700/40 hover:text-emerald-900"><span className="material-symbols-outlined text-[22px]">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              {connectStep === 1 ? (
                <>
                  <p className="text-sm font-semibold text-emerald-900">Primero, configura tu cuenta en 360dialog</p>
                  <div className="space-y-3">
                    {[
                      "Crea una cuenta en 360dialog.com y verifica tu número de empresa.",
                      "En tu panel de 360dialog, ve a Configuración → API Key.",
                      "Copia la API key y pégala en el siguiente paso.",
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-sm text-stone-700">{t}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setConnectStep(2)} className="w-full py-3 bg-emerald-800 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">Ya tengo mi API key →</button>
                </>
              ) : (
                <>
                  <div><label className={lc}>API Key de 360dialog *</label><input className={ic} type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxx" /></div>
                  <div><label className={lc}>Número WhatsApp Business <span className="normal-case font-normal">(opcional)</span></label><input className={ic} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" /></div>
                  {connectErr && <p className="text-sm text-red-600">{connectErr}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setConnectStep(1)} className="px-4 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold">← Atrás</button>
                    <button onClick={connect} disabled={!apiKey.trim() || connecting} className="flex-1 py-3 bg-emerald-800 text-white rounded-xl font-bold text-sm disabled:opacity-40">{connecting ? "Verificando…" : "Verificar y conectar →"}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Channel status */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Estado de los canales</p>
        <div className="space-y-3">
          {/* WhatsApp */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">{waStatus?.connected ? "WhatsApp Business conectado" : "WhatsApp Business"}</p>
                <p className="text-xs text-emerald-700/50 mt-0.5">{waStatus?.connected ? (waStatus.phone ?? "número verificado") : "No conectado — se usará email como alternativa"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {waStatus?.connected ? (
                <>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" />Activo</span>
                  <button onClick={() => disconnectMut.mutate()} disabled={disconnectMut.isPending} className="text-xs text-red-600 font-semibold px-3 py-1.5 border border-red-100 rounded-xl hover:bg-red-50">Desconectar</button>
                </>
              ) : (
                <button onClick={() => setShowConnect(true)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700">Conectar →</button>
              )}
            </div>
          </div>
          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✉️</span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Email (SendGrid)</p>
                <p className="text-xs text-emerald-700/50 mt-0.5">Usado como canal principal o como fallback si no hay WhatsApp</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />Activo</span>
          </div>
        </div>
      </div>

      {/* Message templates */}
      <div className={card}>
        <div className="flex items-end justify-between mb-3">
          <p className={lc}>Plantillas de mensajes automáticos</p>
          <p className="text-[10px] text-emerald-700/40">Placeholders: {PLACEHOLDERS.join(" · ")}</p>
        </div>
        <div className="divide-y divide-emerald-50">
          {(templates ?? Object.keys(TEMPLATE_LABELS).map(k => ({ tipo: parseInt(k), label: TEMPLATE_LABELS[parseInt(k)], contenido: "", isCustom: false }))).map((tpl: any) => (
            <div key={tpl.tipo} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">{tpl.tipo}</span>
                    <p className="text-xs font-bold text-emerald-900">{tpl.label}</p>
                    {tpl.isCustom && <span className="text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">personalizado</span>}
                  </div>
                  {editingTipo === tpl.tipo ? (
                    <div className="space-y-2">
                      <textarea rows={3} value={editText} onChange={e => setEditText(e.target.value)}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => saveTpl(tpl.tipo, editText)} disabled={savingTpl || !editText.trim()} className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-40">{savingTpl ? "Guardando…" : "Guardar"}</button>
                        <button onClick={() => setEditingTipo(null)} className="px-4 py-1.5 text-stone-500 rounded-lg text-xs font-semibold hover:bg-stone-100">Cancelar</button>
                        {tpl.isCustom && <button onClick={async () => { await apiRequest("DELETE", `/api/whatsapp/templates/${tpl.tipo}`); refetchTpls(); setEditingTipo(null); }} className="ml-auto text-xs text-red-500 hover:text-red-700">Restaurar predeterminado</button>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{tpl.contenido}</p>
                  )}
                </div>
                {editingTipo !== tpl.tipo && (
                  <button onClick={() => { setEditingTipo(tpl.tipo); setEditText(tpl.contenido); }} className="flex-shrink-0 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Notificaciones
// ══════════════════════════════════════════════════════════════════════════════

function NotificacionesTab({ user }: { user: any }) {
  const [f, setF] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && !f) setF({
      notifyFormCompleted:  user.notifyFormCompleted  ?? true,
      notifyPaymentReceived: user.notifyPaymentReceived ?? true,
      notifyNewMessage:     user.notifyNewMessage     ?? true,
      dailyDigestEnabled:   user.dailyDigestEnabled   ?? false,
      dailyDigestHour:      user.dailyDigestHour      ?? 8,
    });
  }, [user]);

  const mut = useMutation({
    mutationFn: (d: any) => apiRequest("PUT", "/api/auth/user/notifications", d),
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/user"], (u: any) => ({ ...u, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!f) return null;
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div className={card}>
        <p className={`${lc} mb-4`}>Notificaciones push (al panel)</p>
        <NotifRow label="Formulario completado" desc="Cuando el propietario completa el formulario de tasación o CEE." checked={f.notifyFormCompleted} onChange={() => set("notifyFormCompleted", !f.notifyFormCompleted)} />
        <NotifRow label="Pago confirmado" desc="Cuando un cliente paga (Stripe) o notifica un pago manual." checked={f.notifyPaymentReceived} onChange={() => set("notifyPaymentReceived", !f.notifyPaymentReceived)} />
        <NotifRow label="Nuevo mensaje del cliente" desc="Cuando el cliente responde o envía una comunicación." checked={f.notifyNewMessage} onChange={() => set("notifyNewMessage", !f.notifyNewMessage)} />
      </div>

      <div className={card}>
        <p className={`${lc} mb-4`}>Resumen diario por email</p>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Activar resumen diario</p>
            <p className="text-xs text-emerald-700/50 mt-0.5">Recibe cada día un resumen de la actividad de tu cuenta.</p>
          </div>
          <Toggle checked={f.dailyDigestEnabled} onChange={() => set("dailyDigestEnabled", !f.dailyDigestEnabled)} />
        </div>
        {f.dailyDigestEnabled && (
          <div>
            <label className={lc}>Hora de envío</label>
            <select value={f.dailyDigestHour} onChange={e => set("dailyDigestHour", parseInt(e.target.value))}
              className="bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none">
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4">
        <SavedBadge show={saved} />
        <button onClick={() => mut.mutate(f)} disabled={mut.isPending}
          className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm">
          {mut.isPending ? "Guardando…" : "Guardar preferencias"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — Cuenta y seguridad
// ══════════════════════════════════════════════════════════════════════════════

const TIMEZONES = [
  "Europe/Madrid", "Europe/Canary", "America/Mexico_City",
  "America/Buenos_Aires", "America/Bogota", "America/Lima",
  "America/Santiago", "Europe/London", "Europe/Paris",
];

function SeguridadTab({ user }: { user: any }) {
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdErr, setPwdErr] = useState("");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Europe/Madrid");
  const [tzSaved, setTzSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const pwdMut = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/auth/user/security", { currentPassword: pwd.current, newPassword: pwd.next }),
    onSuccess: () => {
      setPwdSaved(true); setPwd({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSaved(false), 3000);
    },
    onError: (e: any) => setPwdErr(e?.message ?? "Error al cambiar contraseña"),
  });

  const tzMut = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/auth/user/security", { timezone }),
    onSuccess: () => { setTzSaved(true); setTimeout(() => setTzSaved(false), 3000); },
  });

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/auth/user/export", { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `certifive-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const pwdValid = pwd.current && pwd.next.length >= 8 && pwd.next === pwd.confirm;

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div className={card}>
        <p className={`${lc} mb-4`}>Cambiar contraseña</p>
        <div className="space-y-3 max-w-md">
          <div><label className={lc}>Contraseña actual</label><input type="password" className={ic} value={pwd.current} onChange={e => { setPwd(p => ({ ...p, current: e.target.value })); setPwdErr(""); }} autoComplete="current-password" /></div>
          <div><label className={lc}>Nueva contraseña (mín. 8 caracteres)</label><input type="password" className={ic} value={pwd.next} onChange={e => { setPwd(p => ({ ...p, next: e.target.value })); setPwdErr(""); }} autoComplete="new-password" /></div>
          <div><label className={lc}>Confirmar nueva contraseña</label><input type="password" className={ic} value={pwd.confirm} onChange={e => { setPwd(p => ({ ...p, confirm: e.target.value })); setPwdErr(""); }} autoComplete="new-password" /></div>
          {pwd.next && pwd.confirm && pwd.next !== pwd.confirm && <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>}
          {pwdErr && <p className="text-xs text-red-600">{pwdErr}</p>}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <SavedBadge show={pwdSaved} />
          <button onClick={() => pwdMut.mutate()} disabled={!pwdValid || pwdMut.isPending}
            className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm">
            {pwdMut.isPending ? "Cambiando…" : "Cambiar contraseña"}
          </button>
        </div>
      </div>

      {/* Email */}
      <div className={card}>
        <p className={`${lc} mb-3`}>Email de acceso</p>
        <p className="text-sm text-emerald-900 font-semibold">{user?.email ?? "—"}</p>
        <p className="text-xs text-emerald-700/50 mt-1">Para cambiar el email de acceso, contacta con soporte@certifive.es</p>
      </div>

      {/* Timezone */}
      <div className={card}>
        <p className={`${lc} mb-3`}>Zona horaria</p>
        <p className="text-xs text-emerald-700/50 mb-3">Usada para los recordatorios automáticos y los reportes.</p>
        <select value={timezone} onChange={e => setTimezone(e.target.value)}
          className="bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none text-emerald-900 min-w-56">
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
        </select>
        <div className="flex items-center gap-4 mt-4">
          <SavedBadge show={tzSaved} />
          <button onClick={() => tzMut.mutate()} disabled={tzMut.isPending}
            className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm">
            {tzMut.isPending ? "Guardando…" : "Guardar zona horaria"}
          </button>
        </div>
      </div>

      {/* GDPR export */}
      <div className={card}>
        <p className={`${lc} mb-3`}>Exportar mis datos (RGPD)</p>
        <p className="text-sm text-emerald-700/60 mb-4 leading-relaxed">Descarga todos tus datos personales y certificaciones en formato JSON. Conforme al artículo 20 del RGPD (derecho a la portabilidad).</p>
        <button onClick={exportData} disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">download</span>
          {exporting ? "Preparando…" : "Descargar mis datos"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Zona de peligro</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-red-700 text-sm mb-0.5">Cerrar todas las sesiones</p>
            <p className="text-xs text-red-600/70">Deberás volver a autenticarte en todos los dispositivos.</p>
          </div>
          <button className="flex-shrink-0 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">Cerrar sesiones</button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-red-50 pt-4">
          <div>
            <p className="font-semibold text-red-700 text-sm mb-0.5">Eliminar cuenta permanentemente</p>
            <p className="text-xs text-red-600/70">Una vez eliminada, no se puede recuperar el historial de certificaciones.</p>
          </div>
          <button onClick={() => { if (window.confirm("¿Estás seguro? Esta acción es irreversible.")) alert("Contacta con soporte@certifive.es para eliminar la cuenta."); }}
            className="flex-shrink-0 px-5 py-2.5 bg-red-700 text-white rounded-xl text-sm font-semibold hover:bg-red-800 transition-colors shadow-sm">
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — Settings page with tab navigation
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "perfil",         label: "Perfil profesional", icon: "person"        },
  { id: "pagos",          label: "Pagos y facturación", icon: "payments"      },
  { id: "comunicaciones", label: "Comunicaciones",      icon: "chat"          },
  { id: "notificaciones", label: "Notificaciones",      icon: "notifications" },
  { id: "seguridad",      label: "Cuenta y seguridad",  icon: "security"      },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Settings() {
  const [tab, setTab] = useState<TabId>("perfil");
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Configuración</h1>
        <p className="text-sm text-emerald-700/60 mt-1 font-medium">Gestiona tu perfil, pagos, comunicaciones y seguridad.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-emerald-50 p-1 rounded-2xl mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              tab === t.id
                ? "bg-white text-emerald-900 shadow-sm"
                : "text-emerald-700/60 hover:text-emerald-900"
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "perfil"         && <PerfilTab         user={user} />}
      {tab === "pagos"          && <PagosTab          user={user} />}
      {tab === "comunicaciones" && <ComunicacionesTab user={user} />}
      {tab === "notificaciones" && <NotificacionesTab user={user} />}
      {tab === "seguridad"      && <SeguridadTab      user={user} />}

      <footer className="mt-12 pt-8 border-t border-emerald-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">CERTIFIVE</p>
          <p className="text-xs text-emerald-700/40 mt-0.5">© 2026 Certifive. Preciso. Seguro. Conforme.</p>
        </div>
        <div className="flex gap-4">
          {["Privacidad", "Términos", "Cookies"].map(l => (
            <button key={l} className="text-xs text-emerald-700/50 hover:text-emerald-900 transition-colors font-medium">{l}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
