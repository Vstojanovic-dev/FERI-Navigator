import type { AppLanguage } from '../../i18n/language';
import type { Translator } from '../../i18n/translate';
import type { NavigationLocation } from '../../types/navigation';
import { localizeFloorLabel } from '../../utils/displayNames';
import { getLocalizedNavigationLocationLabel } from '../../utils/navigationLocalization';
import { getNearestWcSearchable, navigationLocationToSearchable } from '../../utils/search';

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

export function getTargetSelectionLabel(
  selection: TargetSelection,
  language: AppLanguage,
  t: Translator
): string {
  if (isNearestTarget(selection)) {
    return t('navigation.nearestWc');
  }
  return getLocalizedNavigationLocationLabel(selection, language);
}

export type LocationPickerSuggestion = {
  key: string;
  label: string;
  meta: string;
  value: TargetSelection;
};

export function targetSelectionToSuggestion(
  selection: TargetSelection,
  language: AppLanguage,
  t: Translator
): LocationPickerSuggestion {
  if (isNearestTarget(selection)) {
    return {
      key: selection.id,
      label: t('navigation.nearestWc'),
      meta: t('navigation.nearestWcMeta'),
      value: selection,
    };
  }
  return {
    key: `loc-${selection.id}`,
    label: getTargetSelectionLabel(selection, language, t),
    meta: `${selection.buildingCode} - ${localizeFloorLabel(selection.floorLabel, language)}`,
    value: selection,
  };
}
