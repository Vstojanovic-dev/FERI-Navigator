import type { CatalogSpace } from '../types/catalog';
import type { NavigationLocation } from '../types/navigation';
import { getLocationDisplayName, getSpaceDisplayName } from './displayNames';

export function rankLocations(query: string, locations: NavigationLocation[]): NavigationLocation[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return locations;
  }

  const scoreLocation = (location: NavigationLocation) => {
    const displayName = getLocationDisplayName(location).toLowerCase();
    const fullName = location.displayName.toLowerCase();
    const building = location.buildingName.toLowerCase();
    const floor = location.floorLabel.toLowerCase();
    const description = (location.description ?? '').toLowerCase();
    const spaceName = (location.spaceName ?? '').toLowerCase();

    if (displayName.startsWith(normalized)) {
      return 0;
    }
    if (displayName.includes(normalized)) {
      return 1;
    }
    if (
      fullName.includes(normalized) ||
      spaceName.includes(normalized) ||
      building.includes(normalized) ||
      floor.includes(normalized) ||
      description.includes(normalized)
    ) {
      return 2;
    }
    return 3;
  };

  return [...locations]
    .filter((location) => scoreLocation(location) < 3)
    .sort((left, right) => {
      const byScore = scoreLocation(left) - scoreLocation(right);
      if (byScore !== 0) {
        return byScore;
      }
      return getLocationDisplayName(left).localeCompare(getLocationDisplayName(right));
    });
}

export function rankSpaces(query: string, spaces: CatalogSpace[]): CatalogSpace[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return spaces;
  }

  const scoreSpace = (space: CatalogSpace) => {
    const displayName = getSpaceDisplayName(space).toLowerCase();
    const name = space.name.toLowerCase();
    const type = space.type.toLowerCase();
    const building = space.buildingName.toLowerCase();
    const floor = space.floor.toLowerCase();
    const description = (space.description ?? '').toLowerCase();

    if (displayName.startsWith(normalized)) {
      return 0;
    }
    if (displayName.includes(normalized)) {
      return 1;
    }
    if (
      name.includes(normalized) ||
      type.includes(normalized) ||
      building.includes(normalized) ||
      floor.includes(normalized) ||
      description.includes(normalized)
    ) {
      return 2;
    }
    return 3;
  };

  return [...spaces]
    .filter((space) => scoreSpace(space) < 3)
    .sort((left, right) => {
      const byScore = scoreSpace(left) - scoreSpace(right);
      if (byScore !== 0) {
        return byScore;
      }
      return getSpaceDisplayName(left).localeCompare(getSpaceDisplayName(right));
    });
}
