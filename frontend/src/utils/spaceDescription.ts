import type { AppLanguage } from '../i18n/language';
import type { Translator } from '../i18n/translate';
import type { CatalogSpace } from '../types/catalog';
import { getSpaceDisplayName } from './displayNames';
import { getSpaceTypeFilterKey } from './spaceTypeFilter';

function floorLocative(floor: string | undefined): string {
  const trimmed = floor?.trim();
  if (!trimmed) {
    return 'navedenem nadstropju';
  }

  return trimmed
    .replace(/\bnadstropje\b/gi, 'nadstropju')
    .replace(/\bpritličje\b/gi, 'pritličju');
}

export function getLocalizedSpaceType(type: string, language: AppLanguage): string {
  const normalized = type.trim();
  const lower = normalized.toLowerCase();
  const filterKey = getSpaceTypeFilterKey(normalized);

  if (filterKey === 'classroom') {
    return language === 'en' ? 'classroom' : 'Učilnica';
  }
  if (filterKey === 'laboratory') {
    return language === 'en' ? 'laboratory' : 'Laboratorij';
  }
  if (filterKey === 'office') {
    return language === 'en' ? 'office' : 'Pisarna';
  }
  if (lower === 'public_area' || lower === 'public area') {
    return language === 'en' ? 'public area' : 'Javni prostor';
  }
  if (lower === 'service') {
    return language === 'en' ? 'service space' : 'Servis';
  }
  if (lower === 'wc') {
    return 'WC';
  }

  return normalized;
}

export function buildSpaceDescription(
  space: CatalogSpace,
  language: AppLanguage,
  t: Translator
): string {
  const name = getSpaceDisplayName(space);

  if (language === 'en') {
    return t('spaceDescription.template', {
      name,
      buildingPart: space.buildingName?.trim()
        ? `in building ${space.buildingName.trim()}`
        : 'in the selected building',
      floorPart: space.floor?.trim() ? `on ${space.floor.trim()}` : 'on the listed floor',
      typePhrase: getLocalizedSpaceType(space.type, language),
    });
  }

  return t('spaceDescription.template', {
    name,
    buildingPart: space.buildingName?.trim()
      ? `v objektu ${space.buildingName.trim()}`
      : 'v izbranem objektu',
    floorPart: `v ${floorLocative(space.floor)}`,
    typePhrase: `kot ${getLocalizedSpaceType(space.type, language).toLowerCase()}`,
  });
}
