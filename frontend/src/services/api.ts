const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), init);
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
    throw new ApiError(errorBody.message ?? 'Request failed.', errorBody.code);
  }
  return (await response.json()) as T;
}

export function buildUrl(path: string) {
  if (path.startsWith('http')) {
    return path;
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export function resolveAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  return buildUrl(path);
}
