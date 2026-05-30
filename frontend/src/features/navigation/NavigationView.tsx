import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import { createShare, fetchRoute } from '../../services/navigationService';
import type { NavigationLocation, NavigationRoute } from '../../types/navigation';
import { getLocationDisplayName } from '../../utils/displayNames';
import { findLocationByQuery } from '../../utils/locationMatch';
import { isSearchTypingForward } from '../../utils/searchAutofill';
import { getTargetSelectionLabel } from './locationSelection';
import LocationPicker from './LocationPicker';
import RouteMap from './RouteMap';
import SharePanel from './SharePanel';
import StepList from './StepList';
import { isNearestTarget, NEAREST_WC_TARGET, type TargetSelection } from './navigationTargets';
import { useLocationSearch } from './useLocationSearch';
import styles from './NavigationView.module.css';

const STEP_ICONS: Record<string, string> = {
  straight: '↑',
  slight_left: '↖',
  left: '←',
  slight_right: '↗',
  right: '→',
  turn_back: '↺',
  stairs_up: '⇡',
  stairs_down: '⇣',
  elevator: '🛗',
  elevator_exit: '⇢',
  enter: '↪',
  destination: '●',
  building_transfer: '⇄',
};

function stepIcon(step: { icon: string; maneuverType: string }) {
  return STEP_ICONS[step.icon] ?? STEP_ICONS[step.maneuverType] ?? '↑';
}

type NavigationViewProps = {
  initialTarget: string;
  // Opciono — predpopunjava oba polja iz shared linka
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
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(initialTarget);
  const [fromLocation, setFromLocation] = useState<NavigationLocation | null>(null);
  const [toTarget, setToTarget] = useState<TargetSelection | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [isFormCollapsing, setIsFormCollapsing] = useState(false);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState('');
  const [isRouteVisible, setIsRouteVisible] = useState(false);
  const [transitionNonce, setTransitionNonce] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [routeMode, setRouteMode] = useState<'withLift' | 'withoutLift'>('withLift');
  const prevFromQueryRef = useRef('');
  const prevToQueryRef = useRef('');

  // Bootstrap iz shared linka
  useEffect(() => {
    if (!sharedFromLocationId) return;

    const routeFromShare = async () => {
      setIsRouting(true);
      setError('');
      try {
        const nextRoute = await fetchRoute({
          fromLocationId: sharedFromLocationId,
          toLocationId: sharedToLocationId,
          targetType: sharedTargetType,
          allowElevator: sharedAllowElevator ?? true,
        });
        setRoute(nextRoute);
        setActiveSegmentIndex(0);
        setActiveStepIndex(0);
        setIsRouteVisible(false);
        setTransitionNonce((v) => v + 1);
        setIsFormCollapsing(true);
        window.setTimeout(() => {
          setIsFormExpanded(false);
          setIsFormCollapsing(false);
          setIsRouteVisible(true);
        }, 240);
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
    // Namerno samo ob mountu — ne ponavljamo pri svakom renderu
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
    prevToQueryRef.current = '';
  }, [initialTarget]);

  const fromResults = useLocationSearch(fromQuery);
  const toResults = useLocationSearch(toQuery);
  const activeSegment = route?.segments[activeSegmentIndex] ?? null;
  const activeStep = activeSegment?.steps[activeStepIndex] ?? null;
  const canRoute = Boolean(fromLocation && toTarget && !isRouting);

  useEffect(() => {
    if (!initialTarget.trim() || toTarget) {
      return;
    }

    const normalizedInitial = initialTarget.trim().toLowerCase();
    if (normalizedInitial === NEAREST_WC_TARGET.displayName.toLowerCase()) {
      setToTarget(NEAREST_WC_TARGET);
      setToQuery(NEAREST_WC_TARGET.displayName);
      prevToQueryRef.current = NEAREST_WC_TARGET.displayName;
      return;
    }

    const match = findLocationByQuery(initialTarget, toResults);
    if (!match) {
      return;
    }

    const label = getLocationDisplayName(match);
    setToTarget(match);
    setToQuery(label);
    prevToQueryRef.current = label;
  }, [initialTarget, toResults, toTarget]);

  useEffect(() => {
    const previousValue = prevFromQueryRef.current;
    prevFromQueryRef.current = fromQuery;

    const query = fromQuery.trim();
    if (!query || fromLocation || fromResults.length !== 1) {
      return;
    }
    if (!isSearchTypingForward(previousValue, fromQuery)) {
      return;
    }

    const only = fromResults[0];
    const label = getLocationDisplayName(only);
    if (fromQuery === label) {
      return;
    }

    setFromLocation(only);
    setFromQuery(label);
    prevFromQueryRef.current = label;
  }, [fromQuery, fromResults, fromLocation]);

  useEffect(() => {
    const previousValue = prevToQueryRef.current;
    prevToQueryRef.current = toQuery;

    const query = toQuery.trim();
    if (!query || toTarget || toResults.length !== 1) {
      return;
    }
    if (!isSearchTypingForward(previousValue, toQuery)) {
      return;
    }

    const only = toResults[0];
    const label = getLocationDisplayName(only);
    if (toQuery === label || toQuery === getTargetSelectionLabel(only)) {
      return;
    }

    setToTarget(only);
    setToQuery(label);
    prevToQueryRef.current = label;
  }, [toQuery, toResults, toTarget]);

  const handleRoute = async () => {
    if (!fromLocation || !toTarget) {
      setError('Izberi začetno in ciljno lokacijo iz seznama.');
      return;
    }

    setIsRouting(true);
    setError('');
    try {
      const nextRoute = await fetchRoute({
        fromLocationId: fromLocation.id,
        toLocationId: isNearestTarget(toTarget) ? undefined : toTarget.id,
        targetType: isNearestTarget(toTarget) ? toTarget.targetType : undefined,
        allowElevator: true,
      });
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
    } catch (routeError) {
      setRoute(null);
      setError(routeError instanceof ApiError ? routeError.message : 'Napaka pri računanju poti.');
    } finally {
      setIsRouting(false);
    }
  };

  const moveRouteStep = (direction: 1 | -1) => {
    if (!route) return;
    const segment = route.segments[activeSegmentIndex];
    if (!segment) return;

    const nextStepIndex = activeStepIndex + direction;
    if (nextStepIndex >= 0 && nextStepIndex < segment.steps.length) {
      setActiveStepIndex(nextStepIndex);
      return;
    }

    const nextSegmentIndex = activeSegmentIndex + direction;
    const nextSegment = route.segments[nextSegmentIndex];
    if (!nextSegment) return;

    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(nextSegmentIndex);
    setActiveStepIndex(direction > 0 ? 0 : Math.max(nextSegment.steps.length - 1, 0));
  };

  const jumpToSegment = (index: number) => {
    if (!route || index === activeSegmentIndex || index < 0 || index >= route.segments.length) {
      return;
    }
    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(index);
    setActiveStepIndex(0);
  };

  const compactFromLabel = fromLocation
    ? getLocationDisplayName(fromLocation)
    : fromQuery || 'Začetna lokacija';
  const compactToLabel = toTarget
    ? isNearestTarget(toTarget)
      ? toTarget.displayName
      : getLocationDisplayName(toTarget)
    : toQuery || 'Ciljna lokacija';
  const showRouteLayout = Boolean(route && activeSegment && !isFormExpanded);
  const hasMultipleSegments = Boolean(route && route.segments.length > 1);
  const totalRouteSteps =
    route?.segments.reduce((sum, segment) => sum + segment.steps.length, 0) ?? 0;
  const showStepNav = totalRouteSteps > 1;
  const canMovePrev = Boolean(
    route && activeSegment && !(activeSegmentIndex === 0 && activeStepIndex === 0)
  );
  const canMoveNext = Boolean(
    route &&
      activeSegment &&
      !(
        activeSegmentIndex === route.segments.length - 1 &&
        activeStepIndex >= Math.max(activeSegment.steps.length - 1, 0)
      )
  );

  const stepsWindowSize = 4;
  const stepsWindowStart = activeSegment
    ? Math.floor(activeStepIndex / stepsWindowSize) * stepsWindowSize
    : 0;

  const segmentLabel = route?.segments[activeSegmentIndex]?.floorLabel ?? '';

  const handleShare = async () => {
    if (!fromLocation || !toTarget) {
      window.alert('Deljenje poti bo dodano kasneje.');
      return;
    }

    try {
      const share = await createShare({
        fromLocationId: fromLocation.id,
        toLocationId: isNearestTarget(toTarget) ? undefined : toTarget.id,
        targetType: isNearestTarget(toTarget) ? toTarget.targetType : undefined,
        allowElevator: true,
      });
      setShareUrl(share.shareUrl);
    } catch {
      window.alert('Deljenje poti bo dodano kasneje.');
    }
  };

  return (
    <section className={`${styles.content} ${showRouteLayout ? styles.contentRoute : ''}`}>
      {isFormExpanded || isFormCollapsing ? (
        <div
          className={`${styles.formPanel} ${isFormCollapsing ? styles.formPanelCollapsing : ''}`}
        >
          <LocationPicker
            id="start-location"
            label="Začetna lokacija"
            placeholder="Poišči začetno lokacijo"
            query={fromQuery}
            selected={fromLocation}
            results={fromResults}
            onQueryChange={(value) => {
              prevFromQueryRef.current = fromQuery;
              setFromQuery(value);
              setFromLocation(null);
              setRoute(null);
            }}
            onSelect={(location) => {
              if (isNearestTarget(location)) return;
              const label = getLocationDisplayName(location);
              setFromLocation(location);
              setFromQuery(label);
              prevFromQueryRef.current = label;
            }}
          />

          <LocationPicker
            id="target-location"
            label="Ciljna lokacija"
            placeholder="Poišči cilj"
            query={toQuery}
            selected={toTarget}
            results={toResults}
            nearestTarget={NEAREST_WC_TARGET}
            onQueryChange={(value) => {
              prevToQueryRef.current = toQuery;
              setToQuery(value);
              setToTarget(null);
              setRoute(null);
            }}
            onSelect={(target) => {
              const label = isNearestTarget(target) ? target.displayName : getLocationDisplayName(target);
              setToTarget(target);
              setToQuery(label);
              prevToQueryRef.current = label;
            }}
          />

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
              aria-label="Deli pot"
            >
              <span className={styles.shareIcon} aria-hidden="true">
                ✈
              </span>
            </button>
          )}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}

      {showRouteLayout && route && activeSegment && (
        <div className={`${styles.routeLayout} ${isRouteVisible ? styles.routeLayoutVisible : ''}`}>
          <div className={styles.routeControlsRow}>
            <button
              type="button"
              className={styles.segmentInfoButton}
              onClick={
                hasMultipleSegments
                  ? () => jumpToSegment((activeSegmentIndex + 1) % route.segments.length)
                  : undefined
              }
              disabled={!hasMultipleSegments}
              aria-label={hasMultipleSegments ? 'Spremeni deonico' : segmentLabel}
            >
              <span className={styles.segmentMeta}>{segmentLabel}</span>
              {hasMultipleSegments && (
                <>
                  <span className={styles.segmentCount}>
                    {activeSegmentIndex + 1}/{route.segments.length}
                  </span>
                  <span className={styles.segmentSwitchIcon}>↻</span>
                </>
              )}
            </button>
            <div className={styles.liftToggle} role="group" aria-label="Izbira poti z liftom">
              <button
                type="button"
                className={`${styles.liftOption} ${routeMode === 'withLift' ? styles.liftOptionActive : ''}`}
                onClick={() => setRouteMode('withLift')}
              >
                Z liftom
              </button>
              <button
                type="button"
                className={`${styles.liftOption} ${routeMode === 'withoutLift' ? styles.liftOptionActive : ''}`}
                onClick={() => setRouteMode('withoutLift')}
              >
                Brez lifta
              </button>
            </div>
          </div>
          <div className={styles.mapWrap} key={`map-${activeSegmentIndex}-${transitionNonce}`}>
            <div className={styles.mapAnimated}>
              <RouteMap segment={activeSegment} activeStepIndex={activeStepIndex} />
            </div>
          </div>
          <div className={styles.stepsSection}>
            {activeStep && (
              <article className={styles.activeStepHero}>
                <span className={styles.activeStepHeroIcon} aria-hidden="true">
                  {stepIcon(activeStep)}
                </span>
                <div>
                  <p className={styles.activeStepHeroLabel}>Trenutni korak</p>
                  <p className={styles.activeStepHeroText}>{activeStep.text}</p>
                </div>
              </article>
            )}
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
      )}

      {shareUrl && <SharePanel shareUrl={shareUrl} onClose={() => setShareUrl(null)} />}
    </section>
  );
}

export default NavigationView;
