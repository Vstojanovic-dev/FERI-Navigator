export type Building = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
};

export type Space = {
  id: number;
  name: string;
  type: string;
  buildingId: number;
  floor: string;
  description: string;
  imageUrl: string;
};

export const demoBuildings: Building[] = [
  {
    id: 1,
    name: 'Objekt G2',
    description:
      'Glavna stavba z večjimi učilnicami, predavalnicami in skupnimi prostori za študente.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900',
  },
  {
    id: 2,
    name: 'Objekt G3',
    description: 'Objekt z laboratoriji, delavnicami in tehničnimi prostori za praktično delo.',
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900',
  },
];

export const demoSpaces: Space[] = [
  {
    id: 1,
    name: 'Alfa',
    type: 'Učilnica',
    buildingId: 1,
    floor: '1. nadstropje',
    description:
      'Večja učilnica za predavanja in vaje. Prostor je namenjen študentom, predavanjem in predstavitvam.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900',
  },
  {
    id: 2,
    name: 'Beta',
    type: 'Učilnica',
    buildingId: 1,
    floor: '2. nadstropje',
    description: 'Učilnica za manjše skupine, seminarske vaje in delo v skupinah.',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900',
  },
  {
    id: 3,
    name: 'Laboratorij L1',
    type: 'Laboratorij',
    buildingId: 2,
    floor: 'Pritličje',
    description: 'Laboratorij za praktično delo, računalniške vaje in tehnične predmete.',
    imageUrl: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=900',
  },
  {
    id: 4,
    name: 'Pisarna P3',
    type: 'Pisarna',
    buildingId: 2,
    floor: '1. nadstropje',
    description: 'Pisarniški prostor za sestanke, svetovanje in administrativno delo.',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900',
  },
];

export function getBuildingById(id: number): Building | undefined {
  return demoBuildings.find((building) => building.id === id);
}

export function getBuildingName(buildingId: number): string {
  return getBuildingById(buildingId)?.name ?? 'Neznan objekt';
}

export function getSpacesForBuilding(buildingId: number): Space[] {
  return demoSpaces.filter((space) => space.buildingId === buildingId);
}

export function getSpaceCountForBuilding(buildingId: number): number {
  return getSpacesForBuilding(buildingId).length;
}
