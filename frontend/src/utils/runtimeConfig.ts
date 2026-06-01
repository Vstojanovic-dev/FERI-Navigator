const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export function getApiBaseUrl() {
  if (import.meta.env.PROD && !apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required in production builds.');
  }

  return apiBaseUrl;
}
