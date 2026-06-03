import type { NavigationLocation } from '../../types/navigation';
import {
  getNavigationLocationLabel,
  NEAREST_WC_SEARCHABLE,
  navigationLocationToSearchable,
} from '../../utils/search';

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

export function targetToSearchable(target: TargetSelection) {
  if (isNearestTarget(target)) {
    return NEAREST_WC_SEARCHABLE;
  }
  return navigationLocationToSearchable(target);
}

export function getTargetSelectionLabel(selection: TargetSelection): string {
  if (isNearestTarget(selection)) {
    return selection.displayName;
  }
  return getNavigationLocationLabel(selection);
}

export type LocationPickerSuggestion = {
  key: string;
  label: string;
  meta: string;
  value: TargetSelection;
};

export function targetSelectionToSuggestion(selection: TargetSelection): LocationPickerSuggestion {
  if (isNearestTarget(selection)) {
    return {
      key: selection.id,
      label: selection.displayName,
      meta: selection.meta,
      value: selection,
    };
  }
  return {
    key: `loc-${selection.id}`,
    label: getTargetSelectionLabel(selection),
    meta: `${selection.buildingCode} - ${selection.floorLabel}`,
    value: selection,
  };
}
