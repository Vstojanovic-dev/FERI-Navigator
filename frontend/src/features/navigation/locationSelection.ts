import { getLocationDisplayName } from '../../utils/displayNames';
import { isNearestTarget, type TargetSelection } from './navigationTargets';

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
