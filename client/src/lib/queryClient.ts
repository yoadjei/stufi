import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
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
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Build URL from queryKey array
      // Supports: ['/api/cycles'], ['/api/cycles', id], ['/api/transactions', {cycleId: '123'}]
      let url: string;
      if (Array.isArray(queryKey)) {
        const base = queryKey[0] as string;
        if (queryKey.length === 1) {
          url = base;
        } else if (typeof queryKey[1] === "object" && queryKey[1] !== null) {
          // Query params object
          const params = new URLSearchParams(queryKey[1] as Record<string, string>);
          url = `${base}?${params.toString()}`;
        } else {
          // Path segment (e.g., ID)
          url = `${base}/${queryKey[1]}`;
        }
      } else {
        url = queryKey as unknown as string;
      }

      // Conditionally prepend the backend URL if we are running the frontend on Vercel
      // (where VITE_API_URL is configured)
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const finalUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

      const res = await fetch(finalUrl, { headers });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
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
      staleTime: 30000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
