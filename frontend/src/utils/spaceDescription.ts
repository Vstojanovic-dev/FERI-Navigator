import type { CatalogSpace } from '../types/catalog';
import { getSpaceDisplayName } from './displayNames';

function floorLocative(floor: string | undefined): string {
  const trimmed = floor?.trim();
  if (!trimmed) {
    return 'navedenem nadstropju';
  }

  return trimmed
    .replace(/\bnadstropje\b/gi, 'nadstropju')
    .replace(/\bpritličje\b/gi, 'pritličju');
}

function typeUsagePhrase(type: string | undefined): string {
  const trimmed = type?.trim();
  if (!trimmed) {
    return 'kot prostor fakultete';
  }

  const label = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `kot ${label}`;
}

export function buildSpaceDescription(space: CatalogSpace): string {
  const name = getSpaceDisplayName(space);
  const buildingPart = space.buildingName?.trim()
    ? `v objektu ${space.buildingName.trim()}`
    : 'v izbranem objektu';
  const floorPart = `v ${floorLocative(space.floor)}`;
  const typePhrase = typeUsagePhrase(space.type);

  return (
    `Prostor ${name} se nahaja ${buildingPart}, ${floorPart}. ` +
    `Namenjen je uporabi ${typePhrase} oziroma prostor fakultete. ` +
    'Za pot do prostora lahko uporabite navigacijo, kjer izberete začetno lokacijo in sistem prikaže pot do izbranega cilja.'
  );
}
