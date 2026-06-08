import { getApiBaseUrl } from '../utils/runtimeConfig';
import { getCurrentLanguage } from '../i18n/runtimeLanguage';
import { translate } from '../i18n/translate';

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Accept-Language': getCurrentLanguage(),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    throw new ApiError(
      errorBody.message ?? translate(getCurrentLanguage(), 'errors.requestFailed'),
      errorBody.code
    );
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
