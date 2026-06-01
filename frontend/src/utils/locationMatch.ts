import type { NavigationLocation } from '../types/navigation';
import { getLocationDisplayName } from './displayNames';

export function findLocationByQuery(
  query: string,
  results: NavigationLocation[]
): NavigationLocation | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized || results.length === 0) {
    return null;
  }

  const exact = results.find((location) => {
    const displayName = getLocationDisplayName(location).toLowerCase();
    const fullName = location.displayName.toLowerCase();
    const spaceName = (location.spaceName ?? '').toLowerCase();
    return (
      displayName === normalized || fullName === normalized || spaceName === normalized
    );
  });
  if (exact) {
    return exact;
  }

  if (results.length === 1) {
    const only = results[0];
    const displayName = getLocationDisplayName(only).toLowerCase();
    if (displayName.includes(normalized) || normalized.includes(displayName)) {
      return only;
    }
  }

  return null;
}
