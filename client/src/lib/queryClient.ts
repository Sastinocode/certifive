import { QueryClient } from "@tanstack/react-query";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  isRefreshing = true;
  refreshPromise = fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    })
    .catch(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return false;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

function clearAuthAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.setItem("hasLoggedOut", "true");
  window.location.href = "/";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.status === 401) {
          const refreshed = await tryRefreshToken();
          if (refreshed) {
            const newToken = localStorage.getItem("token");
            const retry = await fetch(url, {
              headers: newToken ? { Authorization: `Bearer ${newToken}` } : {},
            });
            if (retry.ok) return retry.json();
          }
          clearAuthAndRedirect();
          throw new Error("Unauthorized");
        }

        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
      },
      staleTime: 30000,
      retry: 1,
    },
  },
});

export async function apiRequest(method: string, url: string, body?: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && url !== "/api/auth/refresh") {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem("token");
      const retry = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (retry.ok) return retry.json();
    }
    clearAuthAndRedirect();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}
