const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Ошибка запроса");
  }
  return res.json() as Promise<T>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface MethodologyListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  version: string;
  created_at: string;
}

export interface CalculatorItem {
  id: string;
  title: string;
  description: string;
  standard: string;
  enabled: boolean;
}

export interface VesselWallResult {
  results: {
    calculatedThickness: number;
    minimumThickness: number;
    recommendedThickness: number;
    hoopStress: number;
    utilization: number;
  };
  formula: string;
  standard: string;
}
