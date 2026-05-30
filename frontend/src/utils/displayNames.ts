import type { CatalogSpace } from '../types/catalog';
import type { NavigationLocation } from '../types/navigation';

export function getLocationDisplayName(location: NavigationLocation): string {
  if (location.spaceName?.trim()) {
    return location.spaceName.trim();
  }

  const beforeDash = location.displayName.split(' - ')[0]?.trim();
  return beforeDash || location.displayName;
}

export function getSpaceDisplayName(space: Pick<CatalogSpace, 'name' | 'displayName'>): string {
  if (space.displayName?.trim()) {
    return space.displayName.trim();
  }

  const beforeDash = space.name.split(' - ')[0]?.trim() ?? space.name;
  const parts = beforeDash.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return parts[parts.length - 1] ?? space.name;
  }

  return beforeDash || space.name;
}

export function formatSpaceCount(count: number): string {
  if (count === 0) {
    return '0 prostorov';
  }
  if (count === 1) {
    return '1 prostor';
  }
  if (count === 2) {
    return '2 prostora';
  }
  if (count === 3 || count === 4) {
    return `${count} prostori`;
  }
  return `${count} prostorov`;
}
