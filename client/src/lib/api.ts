const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json() as Promise<T>;
};

export const wsUrl = (teamId: number) => {
  const base = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";
  return `${base}?teamId=${teamId}`;
};
