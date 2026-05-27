import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { fetchRoute } from '../../services/navigationService';
import type { NavigationLocation, NavigationRoute } from '../../types/navigation';
import LocationPicker from './LocationPicker';
import RouteMap from './RouteMap';
import SegmentTabs from './SegmentTabs';
import StepList from './StepList';
import { isNearestTarget, NEAREST_WC_TARGET, type TargetSelection } from './navigationTargets';
import { useLocationSearch } from './useLocationSearch';
import styles from './NavigationView.module.css';

type NavigationViewProps = {
  initialTarget: string;
};

function NavigationView({ initialTarget }: NavigationViewProps) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(initialTarget);
  const [fromLocation, setFromLocation] = useState<NavigationLocation | null>(null);
  const [toTarget, setToTarget] = useState<TargetSelection | null>(null);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setToQuery(initialTarget);
    setToTarget(null);
    setRoute(null);
  }, [initialTarget]);

  const fromResults = useLocationSearch(fromQuery);
  const toResults = useLocationSearch(toQuery);
  const activeSegment = route?.segments[activeSegmentIndex] ?? null;
  const canRoute = Boolean(fromLocation && toTarget && !isRouting);

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
    } catch (routeError) {
      setRoute(null);
      setError(routeError instanceof ApiError ? routeError.message : 'Napaka pri računanju poti.');
    } finally {
      setIsRouting(false);
    }
  };

  const moveStep = (direction: 1 | -1) => {
    if (!route) {
      return;
    }

    const segment = route.segments[activeSegmentIndex];
    const nextStepIndex = activeStepIndex + direction;

    if (nextStepIndex >= 0 && nextStepIndex < segment.steps.length) {
      setActiveStepIndex(nextStepIndex);
      return;
    }

    const nextSegmentIndex = activeSegmentIndex + direction;
    const nextSegment = route.segments[nextSegmentIndex];
    if (!nextSegment) {
      return;
    }

    setActiveSegmentIndex(nextSegmentIndex);
    setActiveStepIndex(direction > 0 ? 0 : Math.max(nextSegment.steps.length - 1, 0));
  };

  return (
    <section className={styles.content}>
      <LocationPicker
        id="start-location"
        label="Začetna lokacija"
        placeholder="Poišči začetno lokacijo"
        query={fromQuery}
        selected={fromLocation}
        results={fromResults}
        onQueryChange={(value) => {
          setFromQuery(value);
          setFromLocation(null);
          setRoute(null);
        }}
        onSelect={(location) => {
          if (isNearestTarget(location)) {
            return;
          }
          setFromLocation(location);
          setFromQuery(location.displayName);
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
          setToQuery(value);
          setToTarget(null);
          setRoute(null);
        }}
        onSelect={(target) => {
          setToTarget(target);
          setToQuery(target.displayName);
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

      {error && <p className={styles.errorText}>{error}</p>}

      {route && activeSegment && (
        <>
          <SegmentTabs
            segments={route.segments}
            activeSegmentIndex={activeSegmentIndex}
            onSelect={(index) => {
              setActiveSegmentIndex(index);
              setActiveStepIndex(0);
            }}
          />
          <RouteMap segment={activeSegment} activeStepIndex={activeStepIndex} />
          <StepList segment={activeSegment} activeStepIndex={activeStepIndex} onSelectStep={setActiveStepIndex} />
          <div className={styles.stepControls}>
            <button type="button" className={styles.secondaryButton} onClick={() => moveStep(-1)}>
              Prejšnji
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => moveStep(1)}>
              Naslednji
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default NavigationView;
