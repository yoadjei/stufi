export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Conditionally prepend the backend URL if we are running the frontend on Vercel 
  // (where VITE_API_URL is configured)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const finalUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  return fetch(finalUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `GHS ${num.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getStatusColor(status: "safe" | "tight" | "critical"): string {
  switch (status) {
    case "safe":
      return "bg-emerald-500";
    case "tight":
      return "bg-amber-500";
    case "critical":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export function getStatusBgLight(status: "safe" | "tight" | "critical"): string {
  switch (status) {
    case "safe":
      return "bg-emerald-50";
    case "tight":
      return "bg-amber-50";
    case "critical":
      return "bg-red-50";
    default:
      return "bg-gray-50";
  }
}

export function getStatusText(status: "safe" | "tight" | "critical"): string {
  switch (status) {
    case "safe":
      return "You're doing great!";
    case "tight":
      return "Budget is getting tight";
    case "critical":
      return "Critical - slow down spending";
    default:
      return "";
  }
}
