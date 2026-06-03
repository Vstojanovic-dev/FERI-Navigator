import type { NavigationLocation } from '../types/navigation';
import { getNavigationLocationLabel, getSearchResults, navigationLocationToSearchable } from './search';

export function findLocationByQuery(
  query: string,
  results: NavigationLocation[]
): NavigationLocation | null {
  const ranked = getSearchResults(
    results,
    query,
    navigationLocationToSearchable,
    getNavigationLocationLabel
  );
  if (ranked.length === 0) {
    return null;
  }

  return ranked[0].item;
}
