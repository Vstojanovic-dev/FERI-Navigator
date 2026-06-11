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
  spaceId: number | null;
  spaceName: string | null;
  spaceTypeName: string | null;
  description: string | null;
  imageUrl: string | null;
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

export type BilingualText = {
  sl: string;
  en: string;
};

export type RouteStep = {
  index: number;
  text: string;
  texts?: BilingualText;
  textSl?: string;
  textEn?: string;
  fromNodeId: number;
  toNodeId: number;
  type: string;
  icon: string;
  maneuverType: string;
  zoneId: number | null;
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
  imageScale?: number;
  imageTranslateX?: number;
  imageTranslateY?: number;
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
