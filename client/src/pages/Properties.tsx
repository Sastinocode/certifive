import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate } from "../lib/utils";

export default function Properties() {
  const [search, setSearch] = useState("");

  const { data: folders, isLoading } = useQuery<any[]>({ queryKey: ["/api/folders"] });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/folders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/folders"] }),
  });

  const allFolders = Array.isArray(folders) ? folders : [];
  const filtered = allFolders.filter((f: any) =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    f.cadastralReference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Propiedades archivadas</h1>
          <p className="text-sm text-emerald-700/60 mt-1 font-medium">Archivo final de certificaciones energéticas completadas</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Total carpetas</p>
          <p className="text-3xl font-bold text-emerald-800 tracking-tighter">{allFolders.length}</p>
        </div>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-[20px]">search</span>
        <input
          data-testid="input-search"
          type="text"
          placeholder="Buscar por propietario, referencia catastral..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-400 text-[32px]">folder_open</span>
            </div>
            <p className="font-semibold text-emerald-900 mb-1">
              {search ? "Sin resultados" : "Sin propiedades archivadas"}
            </p>
            <p className="text-sm text-emerald-700/50">
              {search ? "Prueba otra búsqueda" : "Las propiedades aparecen aquí cuando archivas una certificación finalizada"}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100/60">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Carpeta</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Ref. Catastral</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {filtered.map((folder: any) => {
                const initials = (folder.name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={folder.id} data-testid={`row-folder-${folder.id}`} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-emerald-700 text-[18px]">folder</span>
                        </div>
                        <span className="font-semibold text-emerald-900 text-sm">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-emerald-800">{folder.clientName || folder.name}</td>
                    <td className="px-8 py-5 text-xs font-mono text-emerald-700/60">{folder.cadastralReference || "-"}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Finalizado
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-emerald-800">{formatDate(folder.createdAt)}</td>
                    <td className="px-8 py-5 text-right">
                      <button
                        data-testid={`btn-delete-folder-${folder.id}`}
                        onClick={() => { if (window.confirm("¿Eliminar esta carpeta?")) deleteFolderMutation.mutate(folder.id); }}
                        className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-400 hover:text-red-600"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
