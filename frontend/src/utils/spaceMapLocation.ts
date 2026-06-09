import type { CatalogSpace } from '../types/catalog';
import { getBuildingKey, getBuildingPlanImageUrl } from './buildingPlanImages';

export type SpaceMapLocation = {
  mapImageUrl: string;
  markerX: number;
  markerY: number;
};

const FLOOR_PLAN_BY_BUILDING: Record<string, Record<string, string>> = {
  G: {
    pritlicje: '/maps/objekt_g_p.png',
    'ground floor': '/maps/objekt_g_p.png',
    '4. nadstropje': '/maps/objekt_g_4_n.png',
    '4th floor': '/maps/objekt_g_4_n.png',
  },
  G2: {
    '1. nadstropje': '/maps/objekt_g_2_n.png',
    '1st floor': '/maps/objekt_g_2_n.png',
  },
  G3: {
    pritlicje: '/maps/g3_pritlicje.png',
    'ground floor': '/maps/g3_pritlicje.png',
  },
};

const DEFAULT_MARKER_BY_BUILDING: Record<string, { markerX: number; markerY: number }> = {
  C: { markerX: 38, markerY: 52 },
  E: { markerX: 55, markerY: 44 },
  F: { markerX: 48, markerY: 60 },
  G: { markerX: 40, markerY: 50 },
  G2: { markerX: 46, markerY: 54 },
  G3: { markerX: 52, markerY: 48 },
};

/** Demo marker overrides by space id (frontend-only). */
const DEMO_SPACE_MARKERS: Partial<Record<number, SpaceMapLocation>> = {
  9001: { mapImageUrl: '/maps/objekt_c.png', markerX: 35, markerY: 48 },
  9002: { mapImageUrl: '/maps/objekt_c.png', markerX: 62, markerY: 41 },
  9101: { mapImageUrl: '/maps/objekt_e.png', markerX: 44, markerY: 56 },
  9201: { mapImageUrl: '/maps/objekt_f_p.png', markerX: 50, markerY: 45 },
  9301: { mapImageUrl: '/maps/objekt_g_p.png', markerX: 32, markerY: 58 },
  9302: { mapImageUrl: '/maps/objekt_g_4_n.png', markerX: 68, markerY: 32 },
  9401: { mapImageUrl: '/maps/objekt_g_2_n.png', markerX: 42, markerY: 58 },
  9501: { mapImageUrl: '/maps/g3_pritlicje.png', markerX: 58, markerY: 46 },
};

function resolveFloorPlanUrl(buildingName: string, floor: string): string | null {
  const floorPlans = FLOOR_PLAN_BY_BUILDING[getBuildingKey(buildingName)];
  if (!floorPlans) {
    return null;
  }

  const normalizedFloor = floor.trim().toLowerCase();
  for (const [pattern, url] of Object.entries(floorPlans)) {
    if (normalizedFloor.includes(pattern)) {
      return url;
    }
  }

  return null;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function getSpaceMapLocation(space: CatalogSpace): SpaceMapLocation | null {
  const demo = DEMO_SPACE_MARKERS[space.id];

  const mapImageUrl =
    space.mapImageUrl ??
    demo?.mapImageUrl ??
    resolveFloorPlanUrl(space.buildingName, space.floor) ??
    getBuildingPlanImageUrl(space.buildingName);

  if (!mapImageUrl) {
    return null;
  }

  const buildingDefault = DEFAULT_MARKER_BY_BUILDING[getBuildingKey(space.buildingName)];
  const markerX = clampPercent(
    space.markerX ?? demo?.markerX ?? buildingDefault?.markerX ?? 50
  );
  const markerY = clampPercent(
    space.markerY ?? demo?.markerY ?? buildingDefault?.markerY ?? 50
  );

  return { mapImageUrl, markerX, markerY };
}
