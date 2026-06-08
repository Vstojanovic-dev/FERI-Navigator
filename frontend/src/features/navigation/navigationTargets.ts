import type { AppLanguage } from '../../i18n/language';
import type { Translator } from '../../i18n/translate';
import type { NavigationLocation } from '../../types/navigation';
import { localizeFloorLabel } from '../../utils/displayNames';
import {
  getNavigationLocationLabel,
  getNearestWcSearchable,
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

export function createNearestWcTarget(t: Translator): NearestTarget {
  return {
    kind: 'nearest',
    id: 'nearest-wc',
    displayName: t('navigation.nearestWc'),
    targetType: 'wc',
    meta: t('navigation.nearestWcMeta'),
  };
}

export function isNearestTarget(target: TargetSelection): target is NearestTarget {
  return 'kind' in target && target.kind === 'nearest';
}

export function targetToSearchable(target: TargetSelection) {
  if (isNearestTarget(target)) {
    return getNearestWcSearchable(target.displayName);
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

export function targetSelectionToSuggestion(
  selection: TargetSelection,
  language: AppLanguage
): LocationPickerSuggestion {
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
    meta: `${selection.buildingCode} - ${localizeFloorLabel(selection.floorLabel, language)}`,
    value: selection,
  };
}
