import type { CatalogSpace } from '../types/catalog';
import { getBuildingKey, getBuildingPlanImageUrl } from './buildingPlanImages';
import { getSpaceDisplayName } from './displayNames';

export type SpaceMapLocation = {
  mapImageUrl: string;
  markerX?: number;
  markerY?: number;
};

const MAP_WIDTH = 1190.55;
const MAP_HEIGHT = 841.89;

const FLOOR_PLAN_BY_BUILDING: Record<string, Record<string, string>> = {
  C: {
    pritlicje: '/maps/objekt_c.png',
    'ground floor': '/maps/objekt_c.png',
  },
  E: {
    pritlicje: '/maps/objekt_e.png',
    'ground floor': '/maps/objekt_e.png',
    '1. nadstropje': '/maps/objekt_e.png',
    '1st floor': '/maps/objekt_e.png',
  },
  F: {
    pritlicje: '/maps/objekt_f_p.png',
    'ground floor': '/maps/objekt_f_p.png',
    '1. nadstropje': '/maps/objekt_f_1_n.png',
    '1st floor': '/maps/objekt_f_1_n.png',
  },
  G: {
    pritlicje: '/maps/objekt_g_p.png',
    'ground floor': '/maps/objekt_g_p.png',
    '1. medetaza': '/maps/objekt_g_1_m.png',
    '1. nadstropje': '/maps/objekt_g_1_n.png',
    '1st floor': '/maps/objekt_g_1_n.png',
    '2. medetaza': '/maps/objekt_g_2_m.png',
    '2. nadstropje': '/maps/objekt_g_2_n.png',
    '2nd floor': '/maps/objekt_g_2_n.png',
    '3. nadstropje': '/maps/objekt_g_3_n.png',
    '3rd floor': '/maps/objekt_g_3_n.png',
    '4. nadstropje': '/maps/objekt_g_4_n.png',
    '4th floor': '/maps/objekt_g_4_n.png',
  },
  G2: {
    pritlicje: '/maps/1_pritlicje.png',
    'ground floor': '/maps/1_pritlicje.png',
    '1. nadstropje': '/maps/2_nadstropje1.png',
    '1st floor': '/maps/2_nadstropje1.png',
    medetaza: '/maps/3_medetaza.png',
    '2. nadstropje': '/maps/4_nadstropje2.png',
    '2nd floor': '/maps/4_nadstropje2.png',
    '3. nadstropje': '/maps/5_nadstropje3.png',
    '3rd floor': '/maps/5_nadstropje3.png',
    '4. nadstropje': '/maps/6_nadstropje4.png',
    '4th floor': '/maps/6_nadstropje4.png',
  },
  G3: {
    klet: '/maps/g3_klet.png',
    basement: '/maps/g3_klet.png',
    pritlicje: '/maps/g3_pritlicje.png',
    'ground floor': '/maps/g3_pritlicje.png',
    nadstropje: '/maps/g3_nadstropje.png',
    '1. nadstropje': '/maps/g3_nadstropje.png',
    '1st floor': '/maps/g3_nadstropje.png',
    mansarda: '/maps/g3_mansarda.png',
    attic: '/maps/g3_mansarda.png',
  },
};

type MarkerEntry = { mapImageUrl?: string; markerX: number; markerY: number };

function nodeToMarker(x: number, y: number): { markerX: number; markerY: number } {
  return {
    markerX: clampPercent((x / MAP_WIDTH) * 100),
    markerY: clampPercent((y / MAP_HEIGHT) * 100),
  };
}

/** Frontend-only marker overrides by normalized space name. */
const DEMO_SPACE_MARKERS_BY_NAME: Record<string, { markerX: number; markerY: number }> = {
  alfa: nodeToMarker(141.9, 294.0),
  g2p1alfa: nodeToMarker(141.9, 294.0),
  beta: nodeToMarker(139.9, 366.0),
  g2p2beta: nodeToMarker(139.9, 366.0),
  betalab: { markerX: 36, markerY: 54 },
  galerija: nodeToMarker(786.7, 162.4),
  weberlab: nodeToMarker(498.8, 402.9),
  faradlab: nodeToMarker(370.9, 412.9),
  teslalab: nodeToMarker(649.8, 396.9),
  referat: nodeToMarker(813.7, 142.0),
  g2p01: nodeToMarker(657.8, 244.0),
  g2p02: nodeToMarker(486.8, 246.0),
  g2p03: nodeToMarker(338.9, 246.0),
  g2p04: nodeToMarker(647.8, 397.9),
  g2p05: nodeToMarker(498.8, 407.9),
  g2p06: nodeToMarker(368.9, 414.9),
  amperlab: nodeToMarker(375.9, 410.9),
  pascallab: nodeToMarker(500.8, 403.9),
  newtonlab: nodeToMarker(648.8, 398.9),
  g2p4delta: nodeToMarker(145.9, 359.7),
  g2p3gama: nodeToMarker(146.9, 297.7),
  tajnistvodekana: nodeToMarker(809.2, 338.0),
  tajnistvofakultete: nodeToMarker(810.2, 392.0),
  dekan: nodeToMarker(807.2, 256.0),
  senatnasoba: nodeToMarker(813.2, 167.1),
  kavarna: nodeToMarker(264.4, 330.1),
  henrylab: nodeToMarker(372.4, 411.0),
  becquerellab: nodeToMarker(494.4, 406.0),
  lumenlab: nodeToMarker(638.3, 396.0),
  seminarskasobaaleksander: nodeToMarker(230.0, 680.0),
  g21nadstropjeseminarskasoba: nodeToMarker(691.7, 167.0),
  g22nadstropjeseminarskasoba: nodeToMarker(688.7, 168.7),
  g23nadstropjeseminarskasoba: nodeToMarker(690.3, 178.1),
};

/** Frontend-only marker overrides by building|floor|core-name context. */
const DEMO_SPACE_MARKERS_BY_CONTEXT: Record<string, MarkerEntry> = {
  'g2|1nadstropje|seminarskasoba': {
    mapImageUrl: '/maps/2_nadstropje1.png',
    ...nodeToMarker(691.7, 167.0),
  },
  'g2|2nadstropje|seminarskasoba': {
    mapImageUrl: '/maps/4_nadstropje2.png',
    ...nodeToMarker(688.7, 168.7),
  },
  'g2|3nadstropje|seminarskasoba': {
    mapImageUrl: '/maps/5_nadstropje3.png',
    ...nodeToMarker(690.3, 178.1),
  },
  'g3|mansarda|seminarskasobaaleksander': {
    mapImageUrl: '/maps/g3_mansarda.png',
    ...nodeToMarker(230.0, 680.0),
  },
};

/** Frontend-only marker overrides by space id. */
const DEMO_SPACE_MARKERS: Partial<Record<number, MarkerEntry>> = {
  9001: { mapImageUrl: '/maps/objekt_c.png', markerX: 35, markerY: 48 },
  9002: { mapImageUrl: '/maps/objekt_c.png', markerX: 62, markerY: 41 },
  9101: { mapImageUrl: '/maps/objekt_e.png', markerX: 44, markerY: 56 },
  9201: { mapImageUrl: '/maps/objekt_f_p.png', markerX: 50, markerY: 45 },
  9301: { mapImageUrl: '/maps/objekt_g_p.png', markerX: 32, markerY: 58 },
  9302: { mapImageUrl: '/maps/objekt_g_4_n.png', markerX: 68, markerY: 32 },
  9401: { mapImageUrl: '/maps/2_nadstropje1.png', markerX: 42, markerY: 58 },
  9501: { mapImageUrl: '/maps/g3_pritlicje.png', markerX: 58, markerY: 46 },
};

function normalizeKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, '');
}

function normalizeFloorKey(floor: string | null | undefined, floorCode?: string | null): string {
  const fromCode = normalizeKey(floorCode);
  if (fromCode) {
    return fromCode;
  }

  const normalized = normalizeKey(floor);
  if (!normalized) {
    return '';
  }

  if (normalized.includes('pritlicje') || normalized.includes('groundfloor')) {
    return 'pritlicje';
  }
  if (normalized.includes('klet') || normalized.includes('basement')) {
    return 'klet';
  }
  if (normalized.includes('mansarda') || normalized.includes('attic')) {
    return 'mansarda';
  }
  if (normalized.includes('medetaza')) {
    return normalized;
  }

  return normalized;
}

function normalizeBuildingKey(space: CatalogSpace): string {
  const fromCode = space.buildingCode?.trim().toUpperCase();
  if (fromCode) {
    return fromCode.toLowerCase();
  }
  return getBuildingKey(space.buildingName).toLowerCase();
}

function extractCoreSpaceName(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }

  let core = value.trim();
  const dashIndex = core.indexOf(' - ');
  if (dashIndex >= 0) {
    core = core.slice(0, dashIndex).trim();
  }

  core = core.replace(/^[a-z0-9]+[-\s]+/i, '').trim();

  const parenIndex = core.indexOf(' (');
  if (parenIndex >= 0) {
    core = core.slice(0, parenIndex).trim();
  }

  return core;
}

function collectMatchKeys(space: CatalogSpace): string[] {
  const keys = new Set<string>();
  const add = (value: string | null | undefined) => {
    if (!value?.trim()) {
      return;
    }

    keys.add(normalizeKey(value));
    keys.add(normalizeKey(extractCoreSpaceName(value)));
  };

  add(String(space.id));
  add(space.code);
  add(space.displayName);
  add(space.name);
  add(getSpaceDisplayName(space));

  if (space.code) {
    keys.add(normalizeKey(space.code.replace(/_/g, ' ')));
  }

  if (space.buildingCode && space.floorCode && space.name) {
    add(`${space.buildingCode}_${space.floorCode}_${extractCoreSpaceName(space.name)}`);
  }

  return [...keys].filter(Boolean);
}

function buildContextKey(space: CatalogSpace): string | null {
  const building = normalizeBuildingKey(space);
  const floor = normalizeFloorKey(space.floor, space.floorCode);
  const coreName = normalizeKey(extractCoreSpaceName(getSpaceDisplayName(space)) || extractCoreSpaceName(space.name));

  if (!building || !floor || !coreName) {
    return null;
  }

  return `${building}|${floor}|${coreName}`;
}

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

function lookupMarkerByName(keys: string[]): MarkerEntry | null {
  for (const key of keys) {
    if (DEMO_SPACE_MARKERS_BY_NAME[key]) {
      return DEMO_SPACE_MARKERS_BY_NAME[key];
    }
  }

  for (const key of keys) {
    if (key.length < 4) {
      continue;
    }
    for (const [markerKey, marker] of Object.entries(DEMO_SPACE_MARKERS_BY_NAME)) {
      if (markerKey.length < 4) {
        continue;
      }
      if (key.includes(markerKey) || markerKey.includes(key)) {
        return marker;
      }
    }
  }

  return null;
}

function resolveMarkerFromSpace(space: CatalogSpace): MarkerEntry | null {
  if (space.markerX != null && space.markerY != null) {
    return {
      mapImageUrl: space.mapImageUrl ?? undefined,
      markerX: clampPercent(space.markerX),
      markerY: clampPercent(space.markerY),
    };
  }

  const byId = DEMO_SPACE_MARKERS[space.id];
  if (byId) {
    return byId;
  }

  const contextKey = buildContextKey(space);
  if (contextKey && DEMO_SPACE_MARKERS_BY_CONTEXT[contextKey]) {
    return DEMO_SPACE_MARKERS_BY_CONTEXT[contextKey];
  }

  const keys = collectMatchKeys(space);
  return lookupMarkerByName(keys);
}

export function getSpaceMapLocation(space: CatalogSpace): SpaceMapLocation | null {
  const markerEntry = resolveMarkerFromSpace(space);

  const mapImageUrl =
    space.mapImageUrl ??
    resolveFloorPlanUrl(space.buildingName, space.floor) ??
    markerEntry?.mapImageUrl ??
    getBuildingPlanImageUrl(space.buildingName);

  if (!mapImageUrl) {
    return null;
  }

  if (markerEntry) {
    return {
      mapImageUrl,
      markerX: markerEntry.markerX,
      markerY: markerEntry.markerY,
    };
  }

  return { mapImageUrl };
}

export function hasSpaceMapMarker(location: SpaceMapLocation): boolean {
  return location.markerX != null && location.markerY != null;
}
