import type { NavigationLocation, NavigationRoute } from '../../src/types/navigation';

function createLocation(overrides: Partial<NavigationLocation>): NavigationLocation {
  return {
    id: 0,
    displayName: '',
    locationType: 'classroom',
    buildingId: 1,
    buildingCode: 'TEST',
    buildingName: 'Test Building',
    floorId: 1,
    floorCode: 'floor_1',
    floorLabel: 'Floor 1',
    nodeId: null,
    spaceId: null,
    spaceName: null,
    spaceTypeName: null,
    description: null,
    imageUrl: null,
    hasNode: true,
    ...overrides,
  };
}

const straightStart = createLocation({
  id: 101,
  displayName: 'Start - TEST, Floor 1',
  locationType: 'entrance',
  nodeId: 1,
});

const straightEnd = createLocation({
  id: 102,
  displayName: 'End - TEST, Floor 1',
  nodeId: 3,
  spaceId: 3,
  spaceName: 'End',
  spaceTypeName: 'Office',
});

const bentStart = createLocation({
  id: 201,
  displayName: 'Start - TEST, Floor 2',
  buildingId: 2,
  buildingName: 'Bent Building',
  floorId: 2,
  floorCode: 'floor_2',
  floorLabel: 'Floor 2',
  locationType: 'entrance',
  nodeId: 10,
});

const bentEnd = createLocation({
  id: 202,
  displayName: 'End - TEST, Floor 2',
  buildingId: 2,
  buildingName: 'Bent Building',
  floorId: 2,
  floorCode: 'floor_2',
  floorLabel: 'Floor 2',
  nodeId: 13,
  spaceId: 13,
  spaceName: 'End',
  spaceTypeName: 'Office',
});

const repeatedStart = createLocation({
  id: 301,
  displayName: 'Repeat Start - TEST, Floor 3',
  buildingId: 3,
  buildingName: 'Repeated Building',
  floorId: 3,
  floorCode: 'floor_3',
  floorLabel: 'Floor 3',
  locationType: 'entrance',
  nodeId: 1,
});

const repeatedEnd = createLocation({
  id: 302,
  displayName: 'Repeat End - TEST, Floor 3',
  buildingId: 3,
  buildingName: 'Repeated Building',
  floorId: 3,
  floorCode: 'floor_3',
  floorLabel: 'Floor 3',
  nodeId: 4,
  spaceId: 4,
  spaceName: 'Repeat End',
  spaceTypeName: 'Office',
});

const sharedBoundaryStart = createLocation({
  id: 401,
  displayName: 'Shared Start - TEST, Floor 4',
  buildingId: 4,
  buildingName: 'Shared Boundary Building',
  floorId: 4,
  floorCode: 'floor_4',
  floorLabel: 'Floor 4',
  locationType: 'entrance',
  nodeId: 21,
});

const sharedBoundaryEnd = createLocation({
  id: 402,
  displayName: 'Shared End - TEST, Floor 4',
  buildingId: 4,
  buildingName: 'Shared Boundary Building',
  floorId: 4,
  floorCode: 'floor_4',
  floorLabel: 'Floor 4',
  nodeId: 23,
  spaceId: 23,
  spaceName: 'Shared End',
  spaceTypeName: 'Office',
});

const multifloorStart = createLocation({
  id: 501,
  displayName: 'Multi Start - TEST, Floor 2',
  buildingId: 5,
  buildingName: 'Multi Floor Building',
  floorId: 12,
  floorCode: 'floor_2',
  floorLabel: 'Floor 2',
  locationType: 'laboratory',
  nodeId: 901,
});

const multifloorEnd = createLocation({
  id: 502,
  displayName: 'Multi End - TEST, Floor 3',
  buildingId: 5,
  buildingName: 'Multi Floor Building',
  floorId: 13,
  floorCode: 'floor_3',
  floorLabel: 'Floor 3',
  locationType: 'office',
  nodeId: 905,
  spaceId: 905,
  spaceName: 'Multi End',
  spaceTypeName: 'Office',
});

export const routeGeometryLocations: NavigationLocation[] = [
  straightStart,
  straightEnd,
  bentStart,
  bentEnd,
  repeatedStart,
  repeatedEnd,
  sharedBoundaryStart,
  sharedBoundaryEnd,
  multifloorStart,
  multifloorEnd,
];

export const straightGroupedRoute: NavigationRoute = {
  routeId: 'straight-grouped',
  from: straightStart,
  to: straightEnd,
  totalCost: 10,
  segments: [
    {
      index: 0,
      buildingId: 1,
      buildingCode: 'TEST',
      buildingName: 'Straight Building',
      floorId: 1,
      floorCode: 'floor_1',
      floorLabel: 'Floor 1',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 1, externalId: 'A', label: 'A', nodeType: 'corridor', x: 100, y: 100, z: 0 },
        { nodeId: 2, externalId: 'B', label: 'B', nodeType: 'corridor', x: 180, y: 102, z: 0 },
        { nodeId: 3, externalId: 'C', label: 'C', nodeType: 'corridor', x: 260, y: 104, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 1,
          toNodeId: 3,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

export const bentGroupedRoute: NavigationRoute = {
  routeId: 'bent-grouped',
  from: bentStart,
  to: bentEnd,
  totalCost: 10,
  segments: [
    {
      index: 0,
      buildingId: 2,
      buildingCode: 'TEST',
      buildingName: 'Bent Building',
      floorId: 2,
      floorCode: 'floor_2',
      floorLabel: 'Floor 2',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 10, externalId: 'A', label: 'A', nodeType: 'corridor', x: 800, y: 550, z: 0 },
        { nodeId: 11, externalId: 'B', label: 'B', nodeType: 'corridor', x: 790, y: 470, z: 0 },
        { nodeId: 12, externalId: 'C', label: 'C', nodeType: 'corridor', x: 760, y: 430, z: 0 },
        { nodeId: 13, externalId: 'D', label: 'D', nodeType: 'corridor', x: 760, y: 360, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 10,
          toNodeId: 13,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

export const repeatedNodeRoute: NavigationRoute = {
  routeId: 'repeated-node-route',
  from: repeatedStart,
  to: repeatedEnd,
  totalCost: 12,
  segments: [
    {
      index: 0,
      buildingId: 3,
      buildingCode: 'TEST',
      buildingName: 'Repeated Building',
      floorId: 3,
      floorCode: 'floor_3',
      floorLabel: 'Floor 3',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 1, externalId: 'A', label: 'A', nodeType: 'corridor', x: 120, y: 120, z: 0 },
        { nodeId: 2, externalId: 'B1', label: 'B1', nodeType: 'corridor', x: 220, y: 120, z: 0 },
        { nodeId: 3, externalId: 'C', label: 'C', nodeType: 'corridor', x: 320, y: 120, z: 0 },
        { nodeId: 2, externalId: 'B2', label: 'B2', nodeType: 'corridor', x: 420, y: 120, z: 0 },
        { nodeId: 4, externalId: 'D', label: 'D', nodeType: 'corridor', x: 520, y: 120, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Pojdite do notranjega hodnika.',
          fromNodeId: 1,
          toNodeId: 3,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
        {
          index: 1,
          text: 'Nadaljujte do cilja.',
          fromNodeId: 2,
          toNodeId: 4,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

export const sharedBoundaryRoute: NavigationRoute = {
  routeId: 'shared-boundary-route',
  from: sharedBoundaryStart,
  to: sharedBoundaryEnd,
  totalCost: 8,
  segments: [
    {
      index: 0,
      buildingId: 4,
      buildingCode: 'TEST',
      buildingName: 'Shared Boundary Building',
      floorId: 4,
      floorCode: 'floor_4',
      floorLabel: 'Floor 4',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 21, externalId: 'S', label: 'S', nodeType: 'corridor', x: 140, y: 240, z: 0 },
        { nodeId: 22, externalId: 'M', label: 'M', nodeType: 'corridor', x: 240, y: 240, z: 0 },
        { nodeId: 23, externalId: 'E', label: 'E', nodeType: 'corridor', x: 340, y: 240, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Pridite do raskrsnice.',
          fromNodeId: 21,
          toNodeId: 22,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
        {
          index: 1,
          text: 'Nastavite do cilja.',
          fromNodeId: 22,
          toNodeId: 23,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

export const crossFloorEntryRoute: NavigationRoute = {
  routeId: 'cross-floor-entry-route',
  from: multifloorStart,
  to: multifloorEnd,
  totalCost: 20,
  segments: [
    {
      index: 0,
      buildingId: 5,
      buildingCode: 'TEST',
      buildingName: 'Multi Floor Building',
      floorId: 12,
      floorCode: 'floor_2',
      floorLabel: 'Floor 2',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 2,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 901, externalId: 'A', label: 'A', nodeType: 'room', x: 180, y: 300, z: 2 },
        { nodeId: 902, externalId: 'B', label: 'B', nodeType: 'waypoint', x: 260, y: 300, z: 2 },
        { nodeId: 903, externalId: 'S2', label: 'S2', nodeType: 'stairs', x: 340, y: 300, z: 2 },
      ],
      steps: [
        {
          index: 0,
          text: 'Krenite do stepenista.',
          fromNodeId: 901,
          toNodeId: 903,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
    {
      index: 1,
      buildingId: 5,
      buildingCode: 'TEST',
      buildingName: 'Multi Floor Building',
      floorId: 13,
      floorCode: 'floor_3',
      floorLabel: 'Floor 3',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 3,
      usesElevator: false,
      usesStairs: true,
      path: [
        { nodeId: 904, externalId: 'S3', label: 'S3', nodeType: 'stairs', x: 360, y: 220, z: 3 },
        { nodeId: 906, externalId: 'C', label: 'C', nodeType: 'waypoint', x: 430, y: 220, z: 3 },
        { nodeId: 905, externalId: 'D', label: 'D', nodeType: 'room', x: 520, y: 220, z: 3 },
      ],
      steps: [
        {
          index: 0,
          text: 'Izadjite sa stepenista i nastavite po hodniku.',
          fromNodeId: 903,
          toNodeId: 904,
          type: 'stairs',
          icon: 'stairs_down',
          maneuverType: 'stairs_down',
          zoneId: null,
        },
        {
          index: 1,
          text: 'Nastavite do cilja.',
          fromNodeId: 904,
          toNodeId: 905,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

export const routeGeometryFixtures = [
  { name: 'straight-grouped', route: straightGroupedRoute, expectedMode: 'direct' as const },
  { name: 'bent-grouped', route: bentGroupedRoute, expectedMode: 'polyline' as const },
  { name: 'repeated-node-route', route: repeatedNodeRoute, expectedMode: 'direct' as const },
  { name: 'shared-boundary-route', route: sharedBoundaryRoute, expectedMode: 'direct' as const },
  { name: 'cross-floor-entry-route', route: crossFloorEntryRoute, expectedMode: 'direct' as const },
];
