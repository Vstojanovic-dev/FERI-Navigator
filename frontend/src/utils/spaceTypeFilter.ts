import type { CatalogSpace } from '../types/catalog';

export type SpaceTypeFilterKey = 'all' | 'classroom' | 'laboratory' | 'office' | 'other';

export const SPACE_TYPE_FILTERS: { key: SpaceTypeFilterKey; label: string }[] = [
  { key: 'all', label: 'Vsi' },
  { key: 'classroom', label: 'Učilnice' },
  { key: 'laboratory', label: 'Laboratoriji' },
  { key: 'office', label: 'Pisarne' },
  { key: 'other', label: 'Ostalo' },
];

export function getSpaceTypeFilterKey(type: string): Exclude<SpaceTypeFilterKey, 'all'> {
  const normalized = type.trim().toLowerCase();

  if (
    normalized.includes('učilnica') ||
    normalized.includes('ucilnica') ||
    normalized.includes('predavalnica')
  ) {
    return 'classroom';
  }
  if (normalized.includes('laboratorij')) {
    return 'laboratory';
  }
  if (normalized.includes('pisarna')) {
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
