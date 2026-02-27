import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { session } from "./session";

function handleUnauthorized() {
  const currentPath = window.location.pathname;
  const lastRole = localStorage.getItem("titanfleet_last_role");
  fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
  session.clear();
  if (!currentPath.includes('/login') && !currentPath.includes('/setup') && !currentPath.includes('/reset-password') && currentPath !== '/' && currentPath !== '/app') {
    const loginPath = lastRole === 'driver' || currentPath.startsWith('/driver') ? '/app' : '/manager/login';
    window.location.href = loginPath;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized();
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      const hasExistingSession = localStorage.getItem("fleetcheck_user");
      if (hasExistingSession) {
        handleUnauthorized();
      }
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error("401: Session expired. Please log in again.");
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
