import type { BuildingSummary, CatalogSpace } from '../types/catalog';
import type { NavigationLocation } from '../types/navigation';
import { getLocationDisplayName } from '../utils/displayNames';
import { apiFetch } from './api';

type BuildingCatalogDto = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  spaceCount: number;
};

type CatalogSpaceDto = {
  id: number;
  name: string;
  type: string;
  buildingId: number;
  buildingName: string;
  floor: string;
  description: string | null;
  imageUrl: string | null;
};

export async function fetchBuildings(): Promise<BuildingSummary[]> {
  const buildings = await apiFetch<BuildingCatalogDto[]>('/api/catalog/buildings');
  return buildings.map((building) => ({
    ...building,
    spaceCount: Number(building.spaceCount ?? 0),
  }));
}

export async function fetchBuildingSpaces(buildingId: number): Promise<CatalogSpace[]> {
  const spaces = await apiFetch<CatalogSpaceDto[]>(`/api/catalog/buildings/${buildingId}/spaces`);
  return spaces.map((space) => ({
    ...space,
    type: space.type ?? '',
  }));
}

export async function searchSpaces(query: string, limit = 200): Promise<CatalogSpace[]> {
  const params = new URLSearchParams({ query: query.trim(), limit: String(limit) });
  const locations = await apiFetch<NavigationLocation[]>(`/api/navigation/spaces?${params}`);
  return locations.map(mapLocationToCatalogSpace);
}

function buildSyntheticSpaceCode(location: NavigationLocation): string | null {
  if (!location.spaceName?.trim() || !location.buildingCode || !location.floorCode) {
    return null;
  }

  const slug = location.spaceName.trim().toLowerCase().replace(/\s+/g, '_');
  return `${location.buildingCode}_${location.floorCode}_${slug}`;
}

function mapLocationToCatalogSpace(location: NavigationLocation): CatalogSpace {
  const name = location.spaceName ?? location.displayName;
  return {
    id: location.spaceId ?? location.id,
    name,
    displayName: getLocationDisplayName(location),
    type: location.spaceTypeName ?? location.locationType,
    buildingId: location.buildingId,
    buildingName: location.buildingName,
    buildingCode: location.buildingCode,
    floor: location.floorLabel,
    floorCode: location.floorCode,
    description: location.description,
    imageUrl: location.imageUrl,
    code: buildSyntheticSpaceCode(location),
  };
}
