import type { Translator } from '../i18n/translate';
import type { CatalogSpace } from '../types/catalog';

export type SpaceTypeFilterKey = 'all' | 'classroom' | 'laboratory' | 'office' | 'other';

export function getSpaceTypeFilters(t: Translator): { key: SpaceTypeFilterKey; label: string }[] {
  return [
    { key: 'all', label: t('spaceType.all') },
    { key: 'classroom', label: t('spaceType.classroom') },
    { key: 'laboratory', label: t('spaceType.laboratory') },
    { key: 'office', label: t('spaceType.office') },
    { key: 'other', label: t('spaceType.other') },
  ];
}

export function getSpaceTypeFilterKey(type: string): Exclude<SpaceTypeFilterKey, 'all'> {
  const normalized = type.trim().toLowerCase();

  if (
    normalized === 'classroom' ||
    normalized.includes('učilnica') ||
    normalized.includes('ucilnica') ||
    normalized.includes('predavalnica')
  ) {
    return 'classroom';
  }
  if (normalized === 'laboratory' || normalized.includes('laboratorij')) {
    return 'laboratory';
  }
  if (normalized === 'office' || normalized.includes('pisarna')) {
    return 'office';
  }

  return 'other';
}

export function filterSpacesByType(
  spaces: CatalogSpace[],
  filterKey: SpaceTypeFilterKey
): CatalogSpace[] {
  if (filterKey === 'all') {
    return spaces;
  }

  return spaces.filter((space) => getSpaceTypeFilterKey(space.type) === filterKey);
}
