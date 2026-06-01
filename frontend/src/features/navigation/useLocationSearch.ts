import { useEffect, useState } from 'react';
import type { NavigationLocation } from '../../types/navigation';
import { searchLocations } from '../../services/navigationService';
import { rankLocations } from '../../utils/searchRank';

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
            setResults(rankLocations(trimmedQuery, locations));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return results;
}
