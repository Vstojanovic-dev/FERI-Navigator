export type Screen =
  | 'home'
  | 'ucilnica'
  | 'objekti'
  | 'podrobnostiObjekta'
  | 'oFeri'
  | 'navigacija';

export type NavigationLocation = {
  id: number;
  displayName: string;
  locationType: string;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorId: number;
  floorCode: string;
  floorLabel: string;
  nodeId: number | null;
  hasNode: boolean;
};

export type RoutePoint = {
  nodeId: number;
  externalId: string;
  label: string;
  nodeType: string;
  x: number;
  y: number;
  z: number;
};

export type RouteStep = {
  index: number;
  text: string;
  fromNodeId: number;
  toNodeId: number;
  type: string;
};

export type RouteSegment = {
  index: number;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorId: number;
  floorCode: string;
  floorLabel: string;
  mapImageUrl: string;
  coordinateWidth: number;
  coordinateHeight: number;
  z: number;
  usesElevator: boolean;
  usesStairs: boolean;
  path: RoutePoint[];
  steps: RouteStep[];
};

export type NavigationRoute = {
  routeId: string;
  from: NavigationLocation;
  to: NavigationLocation;
  totalCost: number;
  segments: RouteSegment[];
};

export type NavigationApiError = {
  code?: string;
  message?: string;
};
