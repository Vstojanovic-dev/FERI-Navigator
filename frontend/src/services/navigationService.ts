import type { NavigationLocation, NavigationRoute } from '../types/navigation';
import { apiFetch } from './api';

export async function searchLocations(query: string, limit = 20): Promise<NavigationLocation[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const params = new URLSearchParams({ query: trimmedQuery, limit: String(limit) });
  return apiFetch<NavigationLocation[]>(`/api/navigation/locations?${params}`);
}

export async function fetchRoute(input: {
  fromLocationId: number;
  toLocationId?: number;
  targetType?: string;
  allowElevator?: boolean;
}) {
  const params = new URLSearchParams({
    fromLocationId: String(input.fromLocationId),
    allowElevator: String(input.allowElevator ?? true),
  });

  if (input.toLocationId != null) {
    params.set('toLocationId', String(input.toLocationId));
  }

  if (input.targetType) {
    params.set('targetType', input.targetType);
  }

  return apiFetch<NavigationRoute>(`/api/navigation/route?${params}`);
}

// ── Share ────────────────────────────────────────────────────────────────────

export type CreateShareRequest = {
  fromLocationId: number;
  toLocationId?: number;
  targetType?: string;
  allowElevator: boolean;
};

export type CreateShareResponse = {
  shareCode: string;
  shareUrl: string;
};

export type ResolveShareResponse = {
  fromLocationId: number;
  toLocationId?: number;
  targetType?: string;
  allowElevator: boolean;
};

export async function createShare(input: CreateShareRequest): Promise<CreateShareResponse> {
  return apiFetch<CreateShareResponse>('/api/navigation/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function resolveShare(shareCode: string): Promise<ResolveShareResponse> {
  return apiFetch<ResolveShareResponse>(`/api/navigation/share/${shareCode}`);
}

export async function fetchLocation(locationId: number): Promise<NavigationLocation> {
  return apiFetch<NavigationLocation>(`/api/navigation/locations/${locationId}`);
}
