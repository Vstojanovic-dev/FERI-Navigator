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
  displayName?: string;
  type: string;
  buildingId: number;
  buildingName: string;
  floor: string;
  description: string | null;
  imageUrl: string | null;
  code?: string | null;
  purpose?: string | null;
  capacity?: number | null;
  notes?: string | null;
};
