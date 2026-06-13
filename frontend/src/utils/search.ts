import type { BuildingSummary, CatalogSpace } from '../types/catalog';
import type { NavigationLocation } from '../types/navigation';
import { capitalizeFirstLetter, getLocationDisplayName, getSpaceDisplayName } from './displayNames';

export type SearchableFields = {
  displayName?: string;
  name?: string;
  fullName?: string;
  code?: string;
  type?: string;
  building?: string;
  objectName?: string;
  floor?: string;
  keywords?: string[];
  description?: string;
};

export type SearchResult<T> = {
  item: T;
  rank: number;
  label: string;
};

export const NO_MATCH_RANK = 99;
export const AUTOFILL_MAX_RANK = 4;
export const MIN_AUTOFILL_QUERY_LENGTH = 3;

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function getSearchLabel(fields: SearchableFields): string {
  let label = '';
  if (fields.displayName?.trim()) {
    label = fields.displayName.trim();
  } else if (fields.name?.trim()) {
    label = fields.name.trim();
  } else if (fields.fullName?.trim()) {
    label = fields.fullName.trim();
  }
  return capitalizeFirstLetter(label);
}

function rankAgainstQuery(
  normalizedQuery: string,
  normalizedValue: string,
  exactRank: number,
  startsRank: number,
  containsRank: number
): number | null {
  if (!normalizedValue) {
    return null;
  }
  if (normalizedValue === normalizedQuery) {
    return exactRank;
  }
  if (normalizedValue.startsWith(normalizedQuery)) {
    return startsRank;
  }
  if (normalizedValue.includes(normalizedQuery)) {
    return containsRank;
  }
  return null;
}

function minRank(...ranks: (number | null)[]): number {
  const matched = ranks.filter((rank): rank is number => rank !== null);
  if (matched.length === 0) {
    return NO_MATCH_RANK;
  }
  return Math.min(...matched);
}

export function getSearchRank(fields: SearchableFields, query: string): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const displayName = normalizeText(fields.displayName ?? '');
  const names = [fields.name, fields.fullName, fields.code]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => normalizeText(value));
  const keywords = (fields.keywords ?? [])
    .filter((value) => value.trim())
    .map((value) => normalizeText(value));
  const otherFields = [fields.type, fields.building, fields.objectName, fields.floor, fields.description]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => normalizeText(value));

  const keywordRanks = keywords.flatMap((keyword) => {
    const exact = rankAgainstQuery(normalizedQuery, keyword, 0, 5, 6);
    return exact === null ? [] : [exact];
  });

  return minRank(
    rankAgainstQuery(normalizedQuery, displayName, 0, 1, 3),
    ...names.map((name) => rankAgainstQuery(normalizedQuery, name, 2, 2, 4)),
    ...keywordRanks,
    ...otherFields.map((field) => (field.includes(normalizedQuery) ? 7 : null))
  );
}

function compareSearchResults<T>(left: SearchResult<T>, right: SearchResult<T>): number {
  if (left.rank !== right.rank) {
    return left.rank - right.rank;
  }
  if (left.label.length !== right.label.length) {
    return left.label.length - right.label.length;
  }
  return left.label.localeCompare(right.label);
}

export function getSearchResults<T>(
  items: T[],
  query: string,
  toSearchable: (item: T) => SearchableFields,
  getLabel?: (item: T) => string
): SearchResult<T>[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return items.map((item) => {
      const fields = toSearchable(item);
      const label = getLabel?.(item) ?? getSearchLabel(fields);
      return { item, rank: 0, label };
    });
  }

  return items
    .map((item) => {
      const fields = toSearchable(item);
      const label = getLabel?.(item) ?? getSearchLabel(fields);
      return {
        item,
        rank: getSearchRank(fields, query),
        label,
      };
    })
    .filter((result) => result.rank < NO_MATCH_RANK)
    .sort(compareSearchResults);
}

export function isUserDeletingInput(previousValue: string, currentValue: string): boolean {
  return currentValue.length < previousValue.length;
}

export function isUserAddingInput(previousValue: string, currentValue: string): boolean {
  return currentValue.length > previousValue.length;
}

export function isQueryMatchingLabel(query: string, label: string): boolean {
  return normalizeText(query) === normalizeText(label);
}

export function shouldShowSuggestions(
  query: string,
  selectedLabel: string | null,
  resultsCount: number,
  isFocused: boolean
): boolean {
  if (!isFocused) {
    return false;
  }
  if (!normalizeText(query)) {
    return false;
  }
  if (selectedLabel && isQueryMatchingLabel(query, selectedLabel)) {
    return false;
  }
  return resultsCount > 0;
}

export function shouldAutofill<T>(
  previousValue: string,
  currentValue: string,
  results: SearchResult<T>[],
  selected: T | null | undefined,
  isSameItem: (left: T, right: T) => boolean
): T | null {
  if (isUserDeletingInput(previousValue, currentValue)) {
    return null;
  }
  if (!isUserAddingInput(previousValue, currentValue)) {
    return null;
  }
  if (normalizeText(currentValue).length < MIN_AUTOFILL_QUERY_LENGTH) {
    return null;
  }
  if (results.length !== 1) {
    return null;
  }

  const only = results[0];
  if (only.rank > AUTOFILL_MAX_RANK) {
    return null;
  }
  if (isQueryMatchingLabel(currentValue, only.label)) {
    return null;
  }
  if (selected && isSameItem(selected, only.item)) {
    return null;
  }

  return only.item;
}

export function getNearestWcSearchable(displayName: string) {
  return {
    displayName,
    keywords: [
      'wc',
      'najblizji wc',
      'najbližji wc',
      'sanitarije',
      'stranisce',
      'stranišče',
      'toaleta',
      'nearest wc',
      'toilet',
      'restroom',
    ],
  } satisfies SearchableFields;
}

export function catalogSpaceToSearchable(space: CatalogSpace): SearchableFields {
  return {
    displayName: space.displayName,
    name: space.name,
    code: space.code ?? undefined,
    type: space.type,
    building: space.buildingName,
    floor: space.floor,
    description: space.description ?? undefined,
  };
}

export function navigationLocationToSearchable(location: NavigationLocation): SearchableFields {
  return {
    displayName: getLocationDisplayName(location),
    name: location.spaceName ?? undefined,
    fullName: location.displayName,
    keywords: location.searchableName ? [location.searchableName] : undefined,
    type: location.spaceTypeName ?? location.locationType,
    building: location.buildingName,
    objectName: location.buildingCode,
    floor: location.floorLabel,
    description: location.description ?? undefined,
  };
}

export function buildingToSearchable(building: BuildingSummary): SearchableFields {
  return {
    displayName: building.name,
    description: building.description ?? undefined,
  };
}

export function getCatalogSpaceLabel(space: CatalogSpace): string {
  return getSearchLabel(catalogSpaceToSearchable(space)) || getSpaceDisplayName(space);
}

export function getNavigationLocationLabel(location: NavigationLocation): string {
  return getSearchLabel(navigationLocationToSearchable(location)) || getLocationDisplayName(location);
}
