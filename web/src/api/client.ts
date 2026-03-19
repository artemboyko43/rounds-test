export const API_BASE_URL =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? String(import.meta.env.VITE_API_BASE_URL)
    : 'http://localhost:4000';

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

type ApiJsonInit = {
  method: string;
  body?: unknown;
};

export async function apiRequest<T>(path: string, init: ApiJsonInit): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}
