import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import { createShare, fetchRoute } from '../../services/navigationService';
import type { NavigationLocation, NavigationRoute } from '../../types/navigation';
import { findLocationByQuery } from '../../utils/locationMatch';
import {
  getNavigationLocationLabel,
  getSearchResults,
  isQueryMatchingLabel,
  isUserDeletingInput,
  navigationLocationToSearchable,
  shouldAutofill,
} from '../../utils/search';
import {
  getTargetSelectionLabel,
  isSameStartAndEnd,
} from './locationSelection';
import LocationPicker from './LocationPicker';
import RouteMap from './RouteMap';
import SharePanel from './SharePanel';
import StepList from './StepList';
import {
  isNearestTarget,
  targetSelectionToSuggestion,
  targetToSearchable,
  type TargetSelection,
} from './navigationTargets';
import { useLocationSearch } from './useLocationSearch';
import styles from './NavigationView.module.css';

function isSameTarget(left: TargetSelection, right: TargetSelection): boolean {
  if (isNearestTarget(left) || isNearestTarget(right)) {
    return isNearestTarget(left) && isNearestTarget(right);
  }
  return left.id === right.id;
}

type NavigationViewProps = {
  initialTarget: string;
  sharedFromLocationId?: number;
  sharedToLocationId?: number;
  sharedTargetType?: string;
  sharedAllowElevator?: boolean;
};

function NavigationView({
  initialTarget,
  sharedFromLocationId,
  sharedToLocationId,
  sharedTargetType,
  sharedAllowElevator,
}: NavigationViewProps) {
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

  const fromResults = useLocationSearch(fromQuery);
  const toResults = useLocationSearch(toQuery);

  const fromRanked = useMemo(
    () =>
      getSearchResults(fromResults, fromQuery, navigationLocationToSearchable, getNavigationLocationLabel),
    [fromResults, fromQuery]
  );

  const toRanked = useMemo(() => {
    const candidates: TargetSelection[] = toResults.filter(
      (location) => location.locationType !== 'stairs' && location.locationType !== 'wc'
    );
    return getSearchResults(candidates, toQuery, targetToSearchable, getTargetSelectionLabel);
  }, [toResults, toQuery]);

  const fromSuggestions = useMemo(
    () =>
      fromRanked.map((result) => ({
        key: `loc-${result.item.id}`,
        label: result.label,
        meta: `${result.item.buildingCode} - ${result.item.floorLabel}`,
        value: result.item as TargetSelection,
      })),
    [fromRanked]
  );

  const toSuggestions = useMemo(
    () => toRanked.map((result) => targetSelectionToSuggestion(result.item)),
    [toRanked]
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

  const applyRoute = (nextRoute: NavigationRoute) => {
    setRoute(nextRoute);
    setActiveSegmentIndex(0);
    setActiveStepIndex(0);
    setIsRouteVisible(false);
    setTransitionNonce((value) => value + 1);
    setIsFormCollapsing(true);
    window.setTimeout(() => {
      setIsFormExpanded(false);
      setIsFormCollapsing(false);
      setIsRouteVisible(true);
    }, 240);
  };

  // Bootstrap iz shared linka
  useEffect(() => {
    if (!sharedFromLocationId) return;

    setAllowElevator(sharedAllowElevator ?? true);

    const routeFromShare = async () => {
      setIsRouting(true);
      setError('');
      try {
        applyRoute(
          await requestRoute({
            fromLocationId: sharedFromLocationId,
            toLocationId: sharedToLocationId,
            targetType: sharedTargetType,
            allowElevator: sharedAllowElevator ?? true,
            message: 'Deljena pot trenutno ni dostopna.',
          })
        );
      } catch (routeError) {
        setError(
          routeError instanceof ApiError
            ? routeError.message
            : 'Deljena pot trenutno ni dostopna.'
        );
      } finally {
        setIsRouting(false);
      }
    };

    routeFromShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [initialTarget, sharedAllowElevator]);

  const routeSegments = Array.isArray(route?.segments) ? route.segments : [];
  const activeSegment = routeSegments[activeSegmentIndex] ?? routeSegments[0] ?? null;
  const hasSameLocations = isSameStartAndEnd(fromLocation, toTarget);
  const canRoute = Boolean(fromLocation && toTarget && !isRouting && !hasSameLocations);

  useEffect(() => {
    if (!initialTarget.trim() || toTarget) {
      return;
    }

    const match = findLocationByQuery(initialTarget, toResults);
    if (!match) {
      return;
    }

    const label = getNavigationLocationLabel(match);
    setToTarget(match);
    setToQuery(label);
    prevToQueryRef.current = label;
  }, [initialTarget, toResults, toTarget]);

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
      const label = getNavigationLocationLabel(autofillItem);
      setFromLocation(autofillItem);
      setFromQuery(label);
      prevFromQueryRef.current = label;
      return;
    }

    prevFromQueryRef.current = fromQuery;
  }, [fromQuery, fromRanked, fromLocation]);

  useEffect(() => {
    const previousValue = prevToQueryRef.current;
    const autofillItem = shouldAutofill(
      previousValue,
      toQuery,
      toRanked,
      toTarget,
      isSameTarget
    );

    if (autofillItem) {
      const label = getTargetSelectionLabel(autofillItem);
      setToTarget(autofillItem);
      setToQuery(label);
      prevToQueryRef.current = label;
      return;
    }

    prevToQueryRef.current = toQuery;
  }, [toQuery, toRanked, toTarget]);

  const handleFromQueryChange = (value: string) => {
    const previousValue = fromQuery;
    prevFromQueryRef.current = previousValue;

    if (fromLocation) {
      const label = getNavigationLocationLabel(fromLocation);
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
    const previousValue = toQuery;
    prevToQueryRef.current = previousValue;

    if (toTarget) {
      const label = getTargetSelectionLabel(toTarget);
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
      setError('Izberi začetno in ciljno lokacijo iz seznama.');
      return;
    }
    if (isSameStartAndEnd(fromLocation, toTarget)) {
      setRoute(null);
      return;
    }
    setIsRouting(true);
    setError('');
    setShareUrl(null);
    setShareError('');
    try {
      applyRoute(
        await requestRoute({
          fromLocationId: fromLocation.id,
          toLocationId: isNearestTarget(toTarget) ? undefined : toTarget.id,
          targetType: isNearestTarget(toTarget) ? toTarget.targetType : undefined,
          allowElevator,
          message: 'Napaka pri računanju poti.',
        })
      );
    } catch (routeError) {
      setRoute(null);
      setError(routeError instanceof ApiError ? routeError.message : 'Napaka pri računanju poti.');
    } finally {
      setIsRouting(false);
    }
  };

  const handleShare = async () => {
    if (!fromLocation || !toTarget) {
      window.alert('Deljenje poti trenutno ni na voljo.');
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
        shareIssue instanceof ApiError ? shareIssue.message : 'Napaka pri ustvarjanju povezave.'
      );
    } finally {
      setIsCreatingShare(false);
    }
  };

  const moveRouteStep = (direction: 1 | -1) => {
    if (!route) return;
    const segment = routeSegments[activeSegmentIndex];
    if (!segment) return;
    const nextStepIndex = activeStepIndex + direction;
    if (nextStepIndex >= 0 && nextStepIndex < segment.steps.length) {
      setActiveStepIndex(nextStepIndex);
      return;
    }
    const nextSegmentIndex = activeSegmentIndex + direction;
    const nextSegment = routeSegments[nextSegmentIndex];
    if (!nextSegment) return;
    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(nextSegmentIndex);
    setActiveStepIndex(direction > 0 ? 0 : Math.max(nextSegment.steps.length - 1, 0));
  };

  const jumpToSegment = (index: number) => {
    if (!route || index === activeSegmentIndex || index < 0 || index >= routeSegments.length) return;
    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(index);
    setActiveStepIndex(0);
  };

  const compactFromLabel = fromLocation
    ? getNavigationLocationLabel(fromLocation)
    : fromQuery || 'Začetna lokacija';
  const compactToLabel = toTarget ? getTargetSelectionLabel(toTarget) : toQuery || 'Ciljna lokacija';
  const showRouteLayout = Boolean(route && activeSegment && !isFormExpanded);
  const hasMultipleSegments = routeSegments.length > 1;
  const totalRouteSteps =
    routeSegments.reduce((sum, segment) => sum + segment.steps.length, 0);
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
  const segmentLabel = activeSegment?.floorLabel ?? '';

  return (
    <section className={`${styles.content} ${showRouteLayout ? styles.contentRoute : ''}`}>
      {isFormExpanded || isFormCollapsing ? (
        <div className={`${styles.formPanel} ${isFormCollapsing ? styles.formPanelCollapsing : ''}`}>
          <LocationPicker
            id="start-location"
            label="Začetna lokacija"
            placeholder="Poišči začetno lokacijo"
            query={fromQuery}
            selected={fromLocation}
            suggestions={fromSuggestions}
            onQueryChange={handleFromQueryChange}
            onSelect={(location) => {
              if (isNearestTarget(location)) return;
              const label = getNavigationLocationLabel(location);
              setFromLocation(location);
              setFromQuery(label);
              prevFromQueryRef.current = label;
              setRoute(null);
              setShareUrl(null);
            }}
          />
          <LocationPicker
            id="target-location"
            label="Ciljna lokacija"
            placeholder="Poišči cilj"
            query={toQuery}
            selected={toTarget}
            suggestions={toSuggestions}
            onQueryChange={handleToQueryChange}
            onSelect={(target) => {
              const label = getTargetSelectionLabel(target);
              setToTarget(target);
              setToQuery(label);
              prevToQueryRef.current = label;
              setRoute(null);
              setShareUrl(null);
            }}
          />
          <label className={styles.checkboxCard} htmlFor="allow-elevator">
            <span className={styles.checkboxCopy}>
              <span className={styles.checkboxTitle}>Uporabi lift</span>
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
            {isRouting ? 'Računam pot...' : 'Prikaži pot'}
          </button>
        </div>
      ) : (
        <div className={`${styles.compactRouteBar} ${styles.compactRouteRowVisible}`}>
          <button
            type="button"
            className={styles.compactRouteRow}
            onClick={() => {
              setIsFormExpanded(true);
              setIsRouteVisible(false);
            }}
            aria-label="Uredi lokacije"
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
              aria-label="Deli pot"
            >
              <span className={styles.shareIcon} aria-hidden="true">
                ✈
              </span>
            </button>
          )}
        </div>
      )}

      {hasSameLocations && (
        <p className={styles.errorText}>Začetna in ciljna lokacija ne smeta biti enaki.</p>
      )}
      {error && !hasSameLocations && <p className={styles.errorText}>{error}</p>}

      {showRouteLayout && route && activeSegment && (
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
              aria-label={hasMultipleSegments ? 'Spremeni deonico' : segmentLabel}
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
          </div>
          <div className={styles.routeMain}>
            <div className={styles.mapWrap} key={`map-${activeSegmentIndex}-${transitionNonce}`}>
              <div className={styles.mapAnimated}>
                <RouteMap segment={activeSegment} activeStepIndex={activeStepIndex} />
              </div>
            </div>
            <div className={styles.stepsSection}>
              <div className={styles.stepsWrap} key={`steps-${activeSegmentIndex}-${transitionNonce}`}>
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
                      aria-label="Prejšnji korak"
                    >
                      <span className={styles.navArrow}>←</span>
                    </button>
                    <div className={styles.navSpacer} aria-hidden="true" />
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={() => moveRouteStep(1)}
                      disabled={!canMoveNext}
                      aria-label="Naprej"
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


