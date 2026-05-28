import { useEffect, useState } from 'react';
import type { NavigationLocation } from '../../types/navigation';
import { searchLocations } from '../../services/navigationService';

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<NavigationLocation[]>([]);

  useEffect(() => {
    let cancelled = false;

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

    return () => {
      cancelled = true;
    };
  }, [query]);

  return results;
}
