import { useEffect, useState } from 'react';
import type { NavigationLocation } from '../../types/navigation';
import { searchLocations } from '../../services/navigationService';
import {
  getNavigationLocationLabel,
  getSearchResults,
  navigationLocationToSearchable,
} from '../../utils/search';

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<NavigationLocation[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      searchLocations(trimmedQuery)
        .then((locations) => {
          if (!cancelled) {
            setResults(
              getSearchResults(locations, trimmedQuery, navigationLocationToSearchable, getNavigationLocationLabel).map(
                (result) => result.item
              )
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
          }
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return results;
}
