import type { NavigationLocation } from '../../types/navigation';

type NearestTarget = {
  kind: 'nearest';
  id: 'nearest-wc';
  displayName: string;
  targetType: 'wc';
  meta: string;
};

export type TargetSelection = NavigationLocation | NearestTarget;

export const NEAREST_WC_TARGET: NearestTarget = {
  kind: 'nearest',
  id: 'nearest-wc',
  displayName: 'Najbližji WC',
  targetType: 'wc',
  meta: 'Najkrajša dostopna ruta do WC-ja',
};

export function isNearestTarget(target: TargetSelection): target is NearestTarget {
  return 'kind' in target && target.kind === 'nearest';
}
