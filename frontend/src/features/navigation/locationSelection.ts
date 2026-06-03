import type { NavigationLocation } from '../../types/navigation';
import { isQueryMatchingLabel } from '../../utils/search';
import { getTargetSelectionLabel, isNearestTarget, type TargetSelection } from './navigationTargets';

export function isSameStartAndEnd(
  from: NavigationLocation | null,
  to: TargetSelection | null
): boolean {
  if (!from || !to || isNearestTarget(to)) {
    return false;
  }
  return from.id === to.id;
}

export { getTargetSelectionLabel };

export function isQueryMatchingSelection(
  query: string,
  selection: TargetSelection | null
): boolean {
  if (!selection) {
    return false;
  }
  return isQueryMatchingLabel(query, getTargetSelectionLabel(selection));
}
