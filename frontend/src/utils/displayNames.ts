import type { AppLanguage } from '../i18n/language';
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

export function formatSpaceCount(count: number, language: AppLanguage): string {
  if (language === 'en') {
    return count === 1 ? '1 space' : `${count} spaces`;
  }

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

export function localizeFloorLabel(
  floorLabel: string | null | undefined,
  language: AppLanguage
): string {
  const normalized = floorLabel?.trim();
  if (!normalized) {
    return language === 'en' ? 'Listed floor' : 'Navedeno nadstropje';
  }

  if (language === 'sl') {
    return normalized;
  }

  if (/^pritličje$/i.test(normalized)) {
    return 'Ground floor';
  }

  if (/^klet$/i.test(normalized)) {
    return 'Basement';
  }

  const levelMatch = normalized.match(/^(\d+)\.\s*nadstropje$/i);
  if (levelMatch) {
    return `Floor ${levelMatch[1]}`;
  }

  return normalized;
}
