import type { NavigationLocation } from '../../types/navigation';
import { getLocationDisplayName } from '../../utils/displayNames';
import { isNearestTarget, type TargetSelection } from './navigationTargets';

export function isSameStartAndEnd(
  from: NavigationLocation | null,
  to: TargetSelection | null
): boolean {
  if (!from || !to || isNearestTarget(to)) {
    return false;
  }
  return from.id === to.id;
}

export function getTargetSelectionLabel(selection: TargetSelection): string {
  if (isNearestTarget(selection)) {
    return selection.displayName;
  }
  return getLocationDisplayName(selection);
}

export function isQueryMatchingSelection(
  query: string,
  selection: TargetSelection | null
): boolean {
  if (!selection) {
    return false;
  }
  return query.trim() === getTargetSelectionLabel(selection);
}
