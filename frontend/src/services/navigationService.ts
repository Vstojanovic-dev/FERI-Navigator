import type { NavigationLocation, NavigationRoute } from '../types/navigation';
import { apiFetch } from './api';

export async function searchLocations(query: string, limit = 20): Promise<NavigationLocation[]> {
  const params = new URLSearchParams({ query: query.trim(), limit: String(limit) });
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
