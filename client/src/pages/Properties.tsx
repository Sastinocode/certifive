import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate } from "../lib/utils";

export default function Properties() {
  const [search, setSearch] = useState("");

  const { data: folders, isLoading: foldersLoading } = useQuery({ queryKey: ["/api/folders"] });
  const { data: archived } = useQuery({ queryKey: ["/api/certifications?archived=true"] });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/folders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/folders"] }),
  });

  const allFolders = Array.isArray(folders) ? folders : [];
  const archivedCerts = Array.isArray(archived) ? archived : [];

  const filtered = allFolders.filter((f: any) =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    f.cadastralReference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades archivadas</h1>
          <p className="text-gray-500 text-sm mt-1">Archivo final de certificados completados</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
            {allFolders.length} carpeta{allFolders.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por propietario o referencia catastral..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {foldersLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-500 font-medium">No hay propiedades archivadas</p>
            <p className="text-gray-400 text-sm mt-1">Las propiedades aparecen aquí cuando se archiva una certificación finalizada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propietario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref. Catastral</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((folder: any) => (
                  <tr key={folder.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📁</span>
                        <span className="font-medium text-gray-900 text-sm">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{folder.cadastralReference || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Finalizado</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{folder.clientName || folder.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(folder.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { if (window.confirm("¿Eliminar esta carpeta?")) deleteFolderMutation.mutate(folder.id); }}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
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
