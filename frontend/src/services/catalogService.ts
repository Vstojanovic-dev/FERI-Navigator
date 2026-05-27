import type { BuildingSummary, CatalogSpace } from '../types/catalog';
import type { NavigationLocation } from '../types/navigation';
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

const SPACE_TYPE_LABELS: Record<string, string> = {
  classroom: 'Učilnica',
  laboratory: 'Laboratorij',
  office: 'Pisarna',
  public_area: 'Javni prostor',
  service: 'Servis',
  wc: 'WC',
  Classroom: 'Učilnica',
  Laboratory: 'Laboratorij',
  Office: 'Pisarna',
  'Public area': 'Javni prostor',
  Service: 'Servis',
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
    type: toDisplaySpaceType(space.type),
  }));
}

export async function searchSpaces(query: string, limit = 200): Promise<CatalogSpace[]> {
  const params = new URLSearchParams({ query: query.trim(), limit: String(limit) });
  const locations = await apiFetch<NavigationLocation[]>(`/api/navigation/spaces?${params}`);
  return locations.map(mapLocationToCatalogSpace);
}

function mapLocationToCatalogSpace(location: NavigationLocation): CatalogSpace {
  return {
    id: location.spaceId ?? location.id,
    name: location.spaceName ?? location.displayName,
    type: toDisplaySpaceType(location.locationType),
    buildingId: location.buildingId,
    buildingName: location.buildingName,
    floor: location.floorLabel,
    description: location.description,
    imageUrl: location.imageUrl,
  };
}

function toDisplaySpaceType(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return SPACE_TYPE_LABELS[value] ?? value;
}
