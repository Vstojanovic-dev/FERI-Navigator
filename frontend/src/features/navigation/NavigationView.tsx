import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { createShare, fetchRoute } from '../../services/navigationService';
import type { NavigationLocation, NavigationRoute } from '../../types/navigation';
import LocationPicker from './LocationPicker';
import RouteMap from './RouteMap';
import SharePanel from './SharePanel';
import StepList from './StepList';
import { isNearestTarget, NEAREST_WC_TARGET, type TargetSelection } from './navigationTargets';
import { useLocationSearch } from './useLocationSearch';
import { useRoutePdf } from './useRoutePdf';
import styles from './NavigationView.module.css';

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

  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState('');
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);

  const { isGenerating: isGeneratingPdf, downloadPdf } = useRoutePdf();

  // true samo če browser podpira Web Share API (vsi mobilni browseri)
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

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
    setIsSharePanelOpen(false);
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
    setShareUrl(null);
    setShareError('');
    setIsSharePanelOpen(false);
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

  /**
   * Najpre kreiramo share URL na serveru (isto kao i prije).
   * Na mobilnom browseru koji podržava Web Share API odmah otvaramo
   * native share sheet — korisnik bira aplikaciju (WhatsApp, Viber, SMS...).
   * Na desktopu fallback na postojeći SharePanel s copy gumbom.
   */
  const handleShare = async () => {
    if (!fromLocation || !toTarget) return;
    setIsCreatingShare(true);
    setShareError('');
    try {
      const response = await createShare({
        fromLocationId: fromLocation.id,
        toLocationId: isNearestTarget(toTarget) ? undefined : toTarget.id,
        targetType: isNearestTarget(toTarget) ? toTarget.targetType : undefined,
        allowElevator: true,
      });
      setShareUrl(response.shareUrl);

      if (canNativeShare) {
        // Mobitel — otvori native share sheet
        try {
          await navigator.share({
            title: `FERI Navigator: ${fromLocation.displayName} → ${toTarget.displayName}`,
            text: 'Poglej pot na FERI Navigatorju',
            url: response.shareUrl,
          });
          // Korisnik je podijelio ili zatvorio sheet — ne pokazujemo SharePanel
        } catch (shareSheetErr) {
          // AbortError znači da je korisnik sam zatvorio sheet — to nije greška
          if (shareSheetErr instanceof Error && shareSheetErr.name !== 'AbortError') {
            // Neočekivana greška — padamo na SharePanel kao rezerva
            setIsSharePanelOpen(true);
          }
        }
      } else {
        // Desktop — stari SharePanel s copy gumbom
        setIsSharePanelOpen(true);
      }
    } catch (shareErr) {
      setShareError(
        shareErr instanceof ApiError ? shareErr.message : 'Napaka pri ustvarjanju povezave.'
      );
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!route) return;
    downloadPdf(route);
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
    if (!route || index === activeSegmentIndex || index < 0 || index >= route.segments.length) return;
    setTransitionNonce((value) => value + 1);
    setActiveSegmentIndex(index);
    setActiveStepIndex(0);
  };

  const compactFromLabel = fromLocation?.displayName || fromQuery || 'Začetna lokacija';
  const compactToLabel = toTarget?.displayName || toQuery || 'Ciljna lokacija';
  const showRouteLayout = Boolean(route && activeSegment && !isFormExpanded);
  const hasMultipleSegments = Boolean(route && route.segments.length > 1);
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
    ? Math.max(
        0,
        Math.min(
          activeSegment.steps.length - stepsWindowSize,
          activeStepIndex - Math.floor(stepsWindowSize / 2)
        )
      )
    : 0;
  const segmentLabel = route?.segments[activeSegmentIndex]?.floorLabel ?? '';

  return (
    <section className={styles.content}>
      {isFormExpanded || isFormCollapsing ? (
        <div className={`${styles.formPanel} ${isFormCollapsing ? styles.formPanelCollapsing : ''}`}>
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
              setShareUrl(null);
              setIsSharePanelOpen(false);
            }}
            onSelect={(location) => {
              if (isNearestTarget(location)) return;
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
              setShareUrl(null);
              setIsSharePanelOpen(false);
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
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.compactRouteRow} ${styles.compactRouteRowVisible}`}
          onClick={() => {
            setIsFormExpanded(true);
            setIsRouteVisible(false);
            setIsSharePanelOpen(false);
          }}
          aria-label="Uredi lokacije"
        >
          <span className={styles.compactRouteField}>{compactFromLabel}</span>
          <span className={styles.compactRouteArrow}>→</span>
          <span className={styles.compactRouteField}>{compactToLabel}</span>
        </button>
      )}

      {error && <p className={styles.errorText}>{error}</p>}

      {showRouteLayout && route && activeSegment && (
        <div className={`${styles.routeLayout} ${isRouteVisible ? styles.routeLayoutVisible : ''}`}>
          {hasMultipleSegments && (
            <div className={styles.segmentIndicator}>
              <button
                type="button"
                className={styles.segmentInfoButton}
                onClick={() => jumpToSegment((activeSegmentIndex + 1) % route.segments.length)}
                aria-label="Spremeni deonico"
              >
                <span className={styles.segmentMeta}>{segmentLabel}</span>
                <span className={styles.segmentCount}>
                  {activeSegmentIndex + 1}/{route.segments.length}
                </span>
                <span className={styles.segmentSwitchIcon}>↻</span>
              </button>
            </div>
          )}
          <div className={styles.mapWrap} key={`map-${activeSegmentIndex}-${transitionNonce}`}>
            <div className={styles.mapAnimated}>
              <RouteMap segment={activeSegment} activeStepIndex={activeStepIndex} />
            </div>
          </div>
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

          <div className={styles.shareRow}>
            <button
              type="button"
              className={styles.shareButton}
              onClick={handleShare}
              disabled={isCreatingShare}
              aria-label="Deli pot"
            >
              {isCreatingShare ? 'Ustvarjam...' : '↗ Podeli'}
            </button>
            <button
              type="button"
              className={styles.pdfButton}
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              aria-label="Prenesi PDF"
            >
              {isGeneratingPdf ? 'Ustvarjam PDF...' : '⬇ Natisni PDF'}
            </button>
          </div>

          {shareError && <p className={styles.errorText}>{shareError}</p>}

          {/* SharePanel se prikazuje samo na desktopu (canNativeShare = false)
              ili kao rezerva kada native share ne uspije */}
          {isSharePanelOpen && shareUrl && (
            <SharePanel shareUrl={shareUrl} onClose={() => setIsSharePanelOpen(false)} />
          )}

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
        </div>
      )}
    </section>
  );
}

export default NavigationView;
