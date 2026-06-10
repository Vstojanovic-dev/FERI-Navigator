export const BUILDING_PLAN_MAP: Record<string, string> = {
  C: '/maps/objekt_c.png',
  E: '/maps/objekt_e.png',
  F: '/maps/objekt_f_p.png',
  G: '/maps/objekt_g_p.png',
  G2: '/maps/1_pritlicje.png',
  G3: '/maps/g3_pritlicje.png',
};

export function getBuildingKey(buildingName: string | null | undefined): string {
  const normalized = buildingName?.trim() ?? '';
  if (!normalized) {
    return '';
  }

  const match = normalized.match(/(?:objekt|building)\s+([a-z0-9-]+)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  return normalized.toUpperCase();
}

export function getBuildingPlanImageUrl(buildingName: string): string | null {
  return BUILDING_PLAN_MAP[getBuildingKey(buildingName)] ?? null;
}
