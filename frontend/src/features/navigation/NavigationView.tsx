import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { ApiError } from '../../services/api';
import { createShare, fetchLocation, fetchRoute } from '../../services/navigationService';
import type { AppLanguage } from '../../i18n/language';
import type { NavigationLocation, NavigationRoute } from '../../types/navigation';
import { localizeFloorLabel } from '../../utils/displayNames';
import { findLocationByQuery } from '../../utils/locationMatch';
import {
  attachBilingualRouteSteps,
  getLocalizedNavigationLocationLabel,
} from '../../utils/navigationLocalization';
import {
  getSearchResults,
  isQueryMatchingLabel,
  isUserDeletingInput,
  navigationLocationToSearchable,
  shouldAutofill,
} from '../../utils/search';
import { getTargetSelectionLabel, isSameStartAndEnd } from './locationSelection';
import LocationPicker from './LocationPicker';
import RouteMap from './RouteMap';
import SharePanel from './SharePanel';
import StepList from './StepList';
import {
  createNearestWcTarget,
  isNearestTarget,
  targetSelectionToSuggestion,
  targetToSearchable,
  type TargetSelection,
} from './navigationTargets';
import { useLocationSearch } from './useLocationSearch';
import RouteLoadingOverlay from './RouteLoadingOverlay';
import styles from './NavigationView.module.css';

const ROUTE_LOADING_MIN_MS = 800;

function isSameTarget(left: TargetSelection, right: TargetSelection): boolean {
  if (isNearestTarget(left) || isNearestTarget(right)) {
    return isNearestTarget(left) && isNearestTarget(right);
  }
  return left.id === right.id;
}

type NavigationViewProps = {
  initialTarget: string;
  initialFromLocationId?: number;
  sharedFromLocationId?: number;
  sharedToLocationId?: number;
  sharedTargetType?: string;
  sharedAllowElevator?: boolean;
};

function NavigationView({
  initialTarget,
  initialFromLocationId,
  sharedFromLocationId,
  sharedToLocationId,
  sharedTargetType,
  sharedAllowElevator,
}: NavigationViewProps) {
  const { language, t } = useI18n();
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [isFormCollapsing, setIsFormCollapsing] = useState(false);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState('');
  const [isRouteVisible, setIsRouteVisible] = useState(false);
  const [transitionNonce, setTransitionNonce] = useState(0);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState('');
  const [allowElevator, setAllowElevator] = useState(sharedAllowElevator ?? true);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(initialTarget);
  const [fromLocation, setFromLocation] = useState<NavigationLocation | null>(null);
  const [toTarget, setToTarget] = useState<TargetSelection | null>(null);
  const prevFromQueryRef = useRef('');
  const prevToQueryRef = useRef('');
  const userEditedTargetRef = useRef(false);
  const fromResults = useLocationSearch(fromQuery);
  const toResults = useLocationSearch(toQuery);

  const fromRanked = useMemo(
    () =>
      getSearchResults(fromResults, fromQuery, navigationLocationToSearchable, (location) =>
        getLocalizedNavigationLocationLabel(location, language)
      ),
    [fromResults, fromQuery, language]
  );

  const toRanked = useMemo(() => {
    const nearestWc = createNearestWcTarget(t);
    const candidates: TargetSelection[] = [
      nearestWc,
      ...toResults.filter((location) => location.locationType !== 'stairs' && location.locationType !== 'wc'),
    ];

    return getSearchResults(candidates, toQuery, targetToSearchable, (selection) =>
      getTargetSelectionLabel(selection, language, t)
    );
  }, [language, t, toQuery, toResults]);

  const fromSuggestions = useMemo(
    () =>
      fromRanked.map((result) => ({
        key: `loc-${result.item.id}`,
        label: result.label,
        meta: `${result.item.buildingCode} - ${localizeFloorLabel(result.item.floorLabel, language)}`,
        value: result.item as TargetSelection,
      })),
    [fromRanked, language]
  );

  const toSuggestions = useMemo(
    () => toRanked.map((result) => targetSelectionToSuggestion(result.item, language, t)),
    [language, t, toRanked]
  );

  const requestRoute = async ({
    fromLocationId,
    toLocationId,
    targetType,
    allowElevator: nextAllowElevator,
    message,
  }: {
    fromLocationId: number;
    toLocationId?: number;
    targetType?: string;
    allowElevator: boolean;
    message: string;
  }) =>
    requireRouteSegments(
      await fetchRoute({
        fromLocationId,
        toLocationId,
        targetType,
        allowElevator: nextAllowElevator,
      }),
      message
    );

  const buildRouteRequest = () => {
    if (!fromLocation || !toTarget) {
      return null;
    }

    return {
      fromLocationId: fromLocation.id,
      toLocationId: isNearestTarget(toTarget) ? undefined : toTarget.id,
      targetType: isNearestTarget(toTarget) ? toTarget.targetType : undefined,
      allowElevator,
      message: t('navigation.routeCalculationError'),
    };
  };

  const beginRouteSearch = () => {
    setIsRouteVisible(false);
    setIsFormCollapsing(true);
    window.setTimeout(() => {
      setIsFormExpanded(false);
      setIsFormCollapsing(false);
    }, 220);
    setIsRouting(true);
  };

  const applyRoute = (
    nextRoute: NavigationRoute,
    options?: { preserveStep?: boolean; sourceLanguage?: AppLanguage }
  ) => {
    const sourceLanguage = options?.sourceLanguage ?? language;
    const enrichedRoute = attachBilingualRouteSteps(nextRoute, sourceLanguage);
    setRoute(enrichedRoute);
    setFromLocation(enrichedRoute.from);
    setFromQuery(getLocalizedNavigationLocationLabel(enrichedRoute.from, language));

    if (toTarget && !isNearestTarget(toTarget)) {
      setToTarget(enrichedRoute.to);
      setToQuery(getLocalizedNavigationLocationLabel(enrichedRoute.to, language));
    }

    if (options?.preserveStep) {
      setActiveSegmentIndex((prevSegment) => {
        const segmentIndex = Math.min(prevSegment, Math.max(enrichedRoute.segments.length - 1, 0));
        setActiveStepIndex((prevStep) => {
          const segment = enrichedRoute.segments[segmentIndex];
          const maxStep = Math.max((segment?.steps.length ?? 1) - 1, 0);
          return Math.min(prevStep, maxStep);
        });
        return segmentIndex;
      });
    } else {
      setActiveSegmentIndex(0);
      setActiveStepIndex(0);
    }

    setTransitionNonce((value) => value + 1);
    setIsRouteVisible(true);
  };

  useEffect(() => {
    if (!initialFromLocationId || sharedFromLocationId) {
      return;
    }

    let cancelled = false;

    const resolveInitialFromLocation = async () => {
      try {
        const location = await fetchLocation(initialFromLocationId);
        if (cancelled) {
          return;
        }

        const label = getLocalizedNavigationLocationLabel(location, language);
        setFromLocation(location);
        setFromQuery(label);
        prevFromQueryRef.current = label;
      } catch {
        if (!cancelled) {
          setFromLocation(null);
          setFromQuery('');
          prevFromQueryRef.current = '';
        }
      }
    };

    void resolveInitialFromLocation();

    return () => {
      cancelled = true;
    };
  }, [initialFromLocationId, language, sharedFromLocationId]);

  useEffect(() => {
    if (!sharedFromLocationId) {
      return;
    }

    setAllowElevator(sharedAllowElevator ?? true);

    const routeFromShare = async () => {
      const sourceLanguage = language;
      beginRouteSearch();
      setError('');
      try {
        const [nextRoute] = await Promise.all([
          requestRoute({
            fromLocationId: sharedFromLocationId,
            toLocationId: sharedToLocationId,
            targetType: sharedTargetType,
            allowElevator: sharedAllowElevator ?? true,
            message: t('navigation.sharedRouteUnavailable'),
          }),
          new Promise<void>((resolve) => window.setTimeout(resolve, ROUTE_LOADING_MIN_MS)),
        ]);
        applyRoute(nextRoute, { sourceLanguage });
      } catch (routeError) {
        setError(
          routeError instanceof ApiError
            ? routeError.message
            : t('navigation.sharedRouteUnavailable')
        );
      } finally {
        setIsRouting(false);
      }
    };

    void routeFromShare();
  }, [sharedAllowElevator, sharedFromLocationId, sharedTargetType, sharedToLocationId, t]);

  useEffect(() => {
    setToQuery(initialTarget);
    setToTarget(null);
    setRoute(null);
    setIsFormExpanded(true);
    setIsFormCollapsing(false);
    setIsRouteVisible(false);
    setTransitionNonce(0);
    setShareUrl(null);
    setShareError('');
    setAllowElevator(sharedAllowElevator ?? true);
    prevToQueryRef.current = '';
    userEditedTargetRef.current = false;
  }, [initialTarget, sharedAllowElevator]);

  useEffect(() => {
    if (route && !isFormExpanded && fromLocation && toTarget) {
      void handleRoute();
    }
  }, [allowElevator]);

  useEffect(() => {
    if (fromLocation) {
      const label = getLocalizedNavigationLocationLabel(fromLocation, language);
      setFromQuery(label);
      prevFromQueryRef.current = label;
    }

    if (toTarget) {
      const label = getTargetSelectionLabel(toTarget, language, t);
      setToQuery(label);
      prevToQueryRef.current = label;
    }
  }, [language, fromLocation, toTarget, t]);

  const routeSegments = Array.isArray(route?.segments) ? route.segments : [];
  const activeSegment = routeSegments[activeSegmentIndex] ?? routeSegments[0] ?? null;
  const hasSameLocations = isSameStartAndEnd(fromLocation, toTarget);
  const canRoute = Boolean(fromLocation && toTarget && !isRouting && !hasSameLocations);

  useEffect(() => {
    if (!initialTarget.trim() || toTarget || userEditedTargetRef.current) {
      return;
    }

    const match = findLocationByQuery(initialTarget, toResults);
    if (!match) {
      return;
    }

    const label = getLocalizedNavigationLocationLabel(match, language);
    setToTarget(match);
    setToQuery(label);
    prevToQueryRef.current = label;
  }, [initialTarget, language, toResults, toTarget]);

  useEffect(() => {
    const previousValue = prevFromQueryRef.current;
    const autofillItem = shouldAutofill(
      previousValue,
      fromQuery,
      fromRanked,
      fromLocation,
      (left, right) => left.id === right.id
    );

    if (autofillItem) {
      const label = getLocalizedNavigationLocationLabel(autofillItem, language);
      setFromLocation(autofillItem);
      setFromQuery(label);
      prevFromQueryRef.current = label;
      return;
    }

    prevFromQueryRef.current = fromQuery;
  }, [fromLocation, fromQuery, fromRanked, language]);

  useEffect(() => {
    const previousValue = prevToQueryRef.current;
    const autofillItem = shouldAutofill(previousValue, toQuery, toRanked, toTarget, isSameTarget);

    if (autofillItem) {
      const label = getTargetSelectionLabel(autofillItem, language, t);
      setToTarget(autofillItem);
      setToQuery(label);
      prevToQueryRef.current = label;
      return;
    }

    prevToQueryRef.current = toQuery;
  }, [language, t, toQuery, toRanked, toTarget]);

  const handleFromQueryChange = (value: string) => {
    const previousValue = fromQuery;
    prevFromQueryRef.current = previousValue;

    if (fromLocation) {
      const label = getLocalizedNavigationLocationLabel(fromLocation, language);
      if (isUserDeletingInput(previousValue, value) && !isQueryMatchingLabel(value, label)) {
        setFromLocation(null);
      } else if (!isQueryMatchingLabel(value, label)) {
        setFromLocation(null);
      }
    }

    setFromQuery(value);
    setRoute(null);
    setShareUrl(null);
  };

  const handleToQueryChange = (value: string) => {
    userEditedTargetRef.current = true;
    const previousValue = toQuery;
    prevToQueryRef.current = previousValue;

    if (toTarget) {
      const label = getTargetSelectionLabel(toTarget, language, t);
      if (isUserDeletingInput(previousValue, value) && !isQueryMatchingLabel(value, label)) {
        setToTarget(null);
      } else if (!isQueryMatchingLabel(value, label)) {
        setToTarget(null);
      }
    }

    setToQuery(value);
    setRoute(null);
    setShareUrl(null);
  };

  const handleRoute = async () => {
    if (!fromLocation || !toTarget) {
      setError(t('navigation.selectLocationsError'));
      return;
    }
    if (isSameStartAndEnd(fromLocation, toTarget)) {
      setRoute(null);
      return;
    }

    const sourceLanguage = language;
    beginRouteSearch();
    setError('');
    setShareUrl(null);
    setShareError('');
    const request = buildRouteRequest();
    if (!request) {
      setIsRouting(false);
      return;
    }

    try {
      const [nextRoute] = await Promise.all([
        requestRoute(request),
        new Promise<void>((resolve) => window.setTimeout(resolve, ROUTE_LOADING_MIN_MS)),
      ]);
      applyRoute(nextRoute, { sourceLanguage });
    } catch (routeError) {
      setRoute(null);
      setError(
        routeError instanceof ApiError ? routeError.message : t('navigation.routeCalculationError')
      );
    } finally {
      setIsRouting(false);
    }
  };

  const handleShare = async () => {
    if (!fromLocation || !toTarget) {
      window.alert(t('navigation.shareUnavailable'));
      return;
    }

    setIsCreatingShare(true);
    setShareError('');
    try {
      const share = await createShare({
        fromLocationId: fromLocation.id,
        toLocationId: isNearestTarget(toTarget) ? undefined : toTarget.id,
        targetType: isNearestTarget(toTarget) ? toTarget.targetType : undefined,
        allowElevator,
      });
      setShareUrl(share.shareUrl);
    } catch (shareIssue) {
      setShareError(
        shareIssue instanceof ApiError ? shareIssue.message : t('navigation.shareCreateError')
      );
    } finally {
      setIsCreatingShare(false);
    }
  };

  const moveRouteStep = (direction: 1 | -1) => {
    if (!route) {
      return;
    }

    const segment = routeSegments[activeSegmentIndex];
    if (!segment) {
      return;
    }

    const nextStepIndex = activeStepIndex + direction;
    if (nextStepIndex >= 0 && nextStepIndex < segment.steps.length) {
      setActiveStepIndex(nextStepIndex);
      return;
    }

    const nextSegmentIndex = activeSegmentIndex + direction;
    const nextSegment = routeSegments[nextSegmentIndex];
    if (!nextSegment) {
      return;
    }

    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(nextSegmentIndex);
    setActiveStepIndex(direction > 0 ? 0 : Math.max(nextSegment.steps.length - 1, 0));
  };

  const jumpToSegment = (index: number) => {
    if (!route || index === activeSegmentIndex || index < 0 || index >= routeSegments.length) {
      return;
    }

    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(index);
    setActiveStepIndex(0);
  };

  const compactFromLabel = fromLocation
    ? getLocalizedNavigationLocationLabel(fromLocation, language)
    : fromQuery || t('navigation.startFallback');
  const compactToLabel = toTarget
    ? getTargetSelectionLabel(toTarget, language, t)
    : toQuery || t('navigation.targetFallback');
  const showRouteLayout = Boolean(route && activeSegment && !isFormExpanded);
  const hasMultipleSegments = routeSegments.length > 1;
  const totalRouteSteps = routeSegments.reduce((sum, segment) => sum + segment.steps.length, 0);
  const showStepNav = totalRouteSteps > 1;
  const canMovePrev = Boolean(
    route && activeSegment && !(activeSegmentIndex === 0 && activeStepIndex === 0)
  );
  const canMoveNext = Boolean(
    route &&
      activeSegment &&
      !(
        activeSegmentIndex === routeSegments.length - 1 &&
        activeStepIndex >= Math.max(activeSegment.steps.length - 1, 0)
      )
  );
  const stepsWindowSize = 4;
  const stepsWindowStart = activeSegment
    ? Math.floor(activeStepIndex / stepsWindowSize) * stepsWindowSize
    : 0;
  const segmentLabel = activeSegment ? localizeFloorLabel(activeSegment.floorLabel, language) : '';

  const showFormPanel = !isRouting && (isFormExpanded || isFormCollapsing);
  const showCompactRouteBar = !isRouting && !isFormExpanded && !isFormCollapsing;

  return (
    <section className={`${styles.content} ${showRouteLayout ? styles.contentRoute : ''}`}>
      {showFormPanel ? (
        <div className={`${styles.formPanel} ${isFormCollapsing ? styles.formPanelCollapsing : ''}`}>
          <LocationPicker
            id="start-location"
            label={t('navigation.startLabel')}
            placeholder={t('navigation.startPlaceholder')}
            query={fromQuery}
            selected={fromLocation}
            suggestions={fromSuggestions}
            onQueryChange={handleFromQueryChange}
            onSelect={(location) => {
              if (isNearestTarget(location)) {
                return;
              }
              const label = getLocalizedNavigationLocationLabel(location, language);
              setFromLocation(location);
              setFromQuery(label);
              prevFromQueryRef.current = label;
              setRoute(null);
              setShareUrl(null);
            }}
          />
          <LocationPicker
            id="target-location"
            label={t('navigation.targetLabel')}
            placeholder={t('navigation.targetPlaceholder')}
            query={toQuery}
            selected={toTarget}
            suggestions={toSuggestions}
            onQueryChange={handleToQueryChange}
            onSelect={(target) => {
              const label = getTargetSelectionLabel(target, language, t);
              setToTarget(target);
              setToQuery(label);
              prevToQueryRef.current = label;
              setRoute(null);
              setShareUrl(null);
            }}
          />
          <label className={styles.checkboxCard} htmlFor="allow-elevator">
            <span className={styles.checkboxCopy}>
              <span className={styles.checkboxTitle}>{t('navigation.allowElevator')}</span>
            </span>
            <span className={styles.checkboxControl}>
              <input
                id="allow-elevator"
                type="checkbox"
                checked={allowElevator}
                onChange={(event) => {
                  setAllowElevator(event.target.checked);
                  setRoute(null);
                  setShareUrl(null);
                  setShareError('');
                }}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxTrack} aria-hidden="true">
                <span className={styles.checkboxThumb} />
              </span>
            </span>
          </label>
          <button
            type="button"
            className={`${styles.primaryButton} ${!canRoute ? styles.disabledButton : ''}`}
            onClick={handleRoute}
            disabled={!canRoute}
            data-testid="show-route-button"
          >
            {isRouting ? t('navigation.calculatingRoute') : t('navigation.showRoute')}
          </button>
        </div>
      ) : showCompactRouteBar ? (
        <div className={`${styles.compactRouteBar} ${styles.compactRouteRowVisible}`}>
          <button
            type="button"
            className={styles.compactRouteRow}
            onClick={() => {
              setIsFormExpanded(true);
              setIsRouteVisible(false);
            }}
            aria-label={t('navigation.editLocations')}
          >
            <span className={styles.compactRouteField}>{compactFromLabel}</span>
            <span className={styles.compactRouteArrow}>→</span>
            <span className={styles.compactRouteField}>{compactToLabel}</span>
          </button>
          {route && (
            <button
              type="button"
              className={styles.shareButton}
              onClick={handleShare}
              disabled={isCreatingShare}
              aria-label={t('navigation.shareRoute')}
            >
              <span className={styles.shareIcon} aria-hidden="true">
                ✈
              </span>
            </button>
          )}
        </div>
      ) : null}

      {isRouting ? <RouteLoadingOverlay label={t('navigation.searchingRoute')} /> : null}

      {hasSameLocations && <p className={styles.errorText}>{t('navigation.sameLocationsError')}</p>}
      {error && !hasSameLocations && <p className={styles.errorText}>{error}</p>}

      {showRouteLayout && route && activeSegment && !isRouting && (
        <div className={`${styles.routeLayout} ${isRouteVisible ? styles.routeLayoutVisible : ''}`}>
          <div className={styles.routeControlsRow}>
            <button
              type="button"
              className={styles.segmentInfoButton}
              onClick={
                hasMultipleSegments
                  ? () => jumpToSegment((activeSegmentIndex + 1) % routeSegments.length)
                  : undefined
              }
              disabled={!hasMultipleSegments}
              aria-label={hasMultipleSegments ? t('navigation.changeSegment') : segmentLabel}
            >
              <span className={styles.segmentMeta}>{segmentLabel}</span>
              {hasMultipleSegments && (
                <>
                  <span className={styles.segmentCount}>
                    {activeSegmentIndex + 1}/{routeSegments.length}
                  </span>
                  <span className={styles.segmentSwitchIcon}>↻</span>
                </>
              )}
            </button>

            <label className={styles.elevatorCheckboxCompact} htmlFor="allow-elevator-compact">
              <input
                id="allow-elevator-compact"
                type="checkbox"
                checked={allowElevator}
                onChange={(event) => {
                  setAllowElevator(event.target.checked);
                  setShareUrl(null);
                  setShareError('');
                }}
                className={styles.elevatorCheckboxInput}
              />
              <span>{t('navigation.allowElevator')}</span>
            </label>
          </div>
          <div className={styles.routeMain}>
            <div className={styles.mapWrap} key={`map-${activeSegmentIndex}-${transitionNonce}`}>
              <div className={styles.mapAnimated}>
                <RouteMap segment={activeSegment} activeStepIndex={activeStepIndex} />
              </div>
            </div>
            <div className={styles.stepsSection}>
              <div
                className={styles.stepsWrap}
                key={`steps-${activeSegmentIndex}-${transitionNonce}-${language}`}
              >
                <div className={styles.stepsAnimated}>
                  <StepList
                    segment={activeSegment}
                    activeStepIndex={activeStepIndex}
                    onSelectStep={setActiveStepIndex}
                    windowStart={stepsWindowStart}
                    windowSize={stepsWindowSize}
                  />
                </div>
              </div>
              {showStepNav && (
                <div className={styles.bottomNav}>
                  <div className={styles.navButtons}>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={() => moveRouteStep(-1)}
                      disabled={!canMovePrev}
                      aria-label={t('navigation.previousStep')}
                    >
                      <span className={styles.navArrow}>←</span>
                    </button>
                    <div className={styles.navSpacer} aria-hidden="true" />
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={() => moveRouteStep(1)}
                      disabled={!canMoveNext}
                      aria-label={t('navigation.nextStep')}
                    >
                      <span className={styles.navArrow}>→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {shareError && <p className={styles.errorText}>{shareError}</p>}
        </div>
      )}

      {shareUrl && <SharePanel shareUrl={shareUrl} onClose={() => setShareUrl(null)} />}
    </section>
  );
}

function requireRouteSegments(route: NavigationRoute, message: string) {
  if (!Array.isArray(route.segments) || route.segments.length === 0) {
    throw new ApiError(message, 'INVALID_ROUTE_DATA');
  }

  return route;
}

export default NavigationView;
