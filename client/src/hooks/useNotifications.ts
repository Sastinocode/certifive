/**
 * useNotifications
 *
 * Combines TanStack Query (REST) with a live SSE connection so the bell
 * badge and panel update in real-time without polling.
 *
 * - Fetches initial list from GET /api/notifications
 * - Opens EventSource to /api/notifications/stream?token=<jwt>
 * - On each "notification" SSE event, invalidates the query so React
 *   Query re-fetches and the UI updates immediately
 *
 * Safe to call from multiple components — the EventSource is only opened once
 * per component mount, and closes automatically on unmount.
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

export interface Notificacion {
  id: number;
  userId: number;
  certificationId: number | null;
  tipo: string;
  mensaje: string;
  leida: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notificacion[];
  unreadCount: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const queryClient = useQueryClient();

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60_000,   // fallback poll every 60 s if SSE drops
    staleTime:  30_000,
  });

  // ── SSE subscription ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retryDelay = 3_000;

    function connect() {
      es = new EventSource(url);

      es.addEventListener("connected", () => {
        retryDelay = 3_000; // reset backoff on success
      });

      es.addEventListener("notification", () => {
        // A new notification arrived — invalidate cache so the bell updates
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      });

      es.addEventListener("error", () => {
        es.close();
        // Exponential backoff: 3s → 6s → 12s … max 60s
        retryTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 60_000);
          connect();
        }, retryDelay);
      });
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [queryClient]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount:   data?.unreadCount   ?? 0,
    isLoading,
    markRead:    (id: number) => markReadMutation.mutate(id),
    markAllRead: ()           => markAllReadMutation.mutate(),
  };
}
