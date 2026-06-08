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
  /** Frontend demo / optional floor plan for space location preview */
  mapImageUrl?: string | null;
  /** Marker position on plan image, 0–100 percent */
  markerX?: number | null;
  markerY?: number | null;
};
