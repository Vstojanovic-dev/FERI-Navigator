import { useEffect, useState } from 'react';
import type { NavigationLocation } from '../../types/navigation';
import { searchLocations } from '../../services/navigationService';

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<NavigationLocation[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      searchLocations(query)
        .then((locations) => {
          if (!cancelled) {
            setResults(locations);
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
