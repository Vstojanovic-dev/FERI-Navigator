export const BUILDING_PLAN_MAP: Record<string, string> = {
  'Objekt C': '/maps/objekt_c.png',
  'Objekt E': '/maps/objekt_e.png',
  'Objekt F': '/maps/objekt_f_p.png',
  'Objekt G': '/maps/objekt_g_p.png',
  'Objekt G2': '/maps/objekt_g_2_n.png',
  'Objekt G3': '/maps/g3_pritlicje.png',
};

export function getBuildingPlanImageUrl(buildingName: string): string | null {
  return BUILDING_PLAN_MAP[buildingName] ?? null;
}
