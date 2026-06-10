import type { AppLanguage } from '../i18n/language';
import type { CatalogSpace } from '../types/catalog';
import type { NavigationLocation } from '../types/navigation';

export function capitalizeFirstLetter(text: string): string {
  if (!text) {
    return '';
  }
  let formatted = text.trim();
  if (formatted.length === 0) {
    return '';
  }
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  formatted = formatted.replace(/[tT]ajništvo\s+[dD]ekana/g, 'Tajništvo Dekana');
  formatted = formatted.replace(/[tT]ajnistvo\s+[dD]ekana/g, 'Tajništvo Dekana');
  return formatted;
}

export function getLocationDisplayName(location: NavigationLocation): string {
  let name = '';
  if (location.spaceName?.trim()) {
    name = location.spaceName.trim();
  } else {
    const beforeDash = location.displayName.split(' - ')[0]?.trim();
    name = beforeDash || location.displayName;
  }
  return capitalizeFirstLetter(name);
}

export function getSpaceDisplayName(space: Pick<CatalogSpace, 'name' | 'displayName'>): string {
  let name = '';
  if (space.displayName?.trim()) {
    name = space.displayName.trim();
  } else {
    const beforeDash = space.name.split(' - ')[0]?.trim() ?? space.name;
    const parts = beforeDash.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      name = parts[parts.length - 1] ?? space.name;
    } else {
      name = beforeDash || space.name;
    }
  }
  return capitalizeFirstLetter(name);
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

function toOrdinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
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

  if (/^pritli[\u010d\u0107]?je$/i.test(normalized)) {
    return 'Ground Floor';
  }

  if (/^klet$/i.test(normalized)) {
    return 'Basement';
  }

  const levelMatch = normalized.match(/^(\d+)\.\s*nadstropje$/i);
  if (levelMatch) {
    return `${toOrdinal(Number(levelMatch[1]))} Floor`;
  }

  return normalized;
}
