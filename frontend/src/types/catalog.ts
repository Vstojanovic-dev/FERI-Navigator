export type BuildingSummary = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  spaceCount: number;
};

export type CatalogSpace = {
  id: number;
  name: string;
  type: string;
  buildingId: number;
  buildingName: string;
  floor: string;
  description: string | null;
  imageUrl: string | null;
};
