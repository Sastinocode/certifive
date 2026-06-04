/**
 * CERTIFIVE — Panel de Administración
 * Solo accesible para usuarios con role === "admin"
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCerts: number;
  planBreakdown: { plan: string | null; count: number }[];
}

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  emailVerifiedAt: string | null;
  createdAt: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function planBadge(plan: string | null) {
  const colors: Record<string, string> = {
    free:        "bg-gray-100 text-gray-600",
    basico:      "bg-blue-100 text-blue-700",
    profesional: "bg-purple-100 text-purple-700",
    empresa:     "bg-amber-100 text-amber-700",
  };
  const p = plan ?? "free";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[p] ?? colors.free}`}>
      {p}
    </span>
  );
}

function statusDot(status: string | null) {
  if (status === "active")   return <span className="w-2 h-2 rounded-full bg-green-400 inline-block" title="Activo" />;
  if (status === "trialing") return <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" title="Trial" />;
  if (status === "canceled") return <span className="w-2 h-2 rounded-full bg-red-400 inline-block" title="Cancelado" />;
  return <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" title={status ?? "—"} />;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Guard: redirige si no es admin
  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (user?.role !== "admin") { navigate("/"); }
  }, [isAuthenticated, user]);

  // Carga stats
  useEffect(() => {
    fetch("/api/admin/stats", { headers: authHeaders() })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  // Carga usuarios al montar
  useEffect(() => { loadUsers(1, ""); }, []);

  async function loadUsers(page: number, q: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("search", q);
      const res  = await fetch(`/api/admin/users?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setUsers(data.users ?? []);
      setPagination(data.pagination ?? { page: 1, pages: 1, total: 0 });
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(userId: number, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() } as HeadersInit,
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "Rol actualizado", description: `Usuario ahora es ${newRole}` });
      loadUsers(pagination.page, search);
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de usuarios y métricas del sistema</p>
          </div>
          <button onClick={() => navigate("/")} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            ← Volver al dashboard
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Usuarios totales"      value={stats.totalUsers}  color="blue" />
            <StatCard label="Suscripciones activas" value={stats.activeUsers} color="green" />
            <StatCard label="Certificaciones"       value={stats.totalCerts}  color="purple" />
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-2">Por plan</p>
              <div className="space-y-1">
                {stats.planBreakdown.map(p => (
                  <div key={p.plan ?? "null"} className="flex justify-between text-xs">
                    <span className="capitalize text-gray-600 dark:text-gray-400">{p.plan ?? "free"}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              Usuarios <span className="text-gray-400 font-normal text-sm">({pagination.total})</span>
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por email, nombre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadUsers(1, search)}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button onClick={() => loadUsers(1, search)} className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700">
                Buscar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Verificado</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay usuarios</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{u.name ?? u.username}</div>
                      <div className="text-xs text-gray-400">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">{planBadge(u.subscriptionPlan)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusDot(u.subscriptionStatus)}
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{u.subscriptionStatus ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.emailVerifiedAt
                        ? <span className="text-green-600 text-xs">✓ Sí</span>
                        : <span className="text-red-500 text-xs">✗ No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        disabled={actionLoading === u.id}
                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {u.role === "admin" ? "→ user" : "→ admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => loadUsers(pagination.page - 1, search)} disabled={pagination.page <= 1}
                className="text-sm px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">Página {pagination.page} de {pagination.pages}</span>
              <button onClick={() => loadUsers(pagination.page + 1, search)} disabled={pagination.page >= pagination.pages}
                className="text-sm px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = { blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600" };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color] ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}
