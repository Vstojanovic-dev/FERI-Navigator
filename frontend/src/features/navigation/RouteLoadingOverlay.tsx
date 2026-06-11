import styles from './RouteLoadingOverlay.module.css';

type RouteLoadingOverlayProps = {
  label: string;
};

function RouteLoadingOverlay({ label }: RouteLoadingOverlayProps) {
  return (
    <div className={styles.overlay} data-testid="route-loading" role="status" aria-live="polite" aria-busy="true">
      <div className={styles.panel}>
        <div className={styles.radarWrap} aria-hidden="true">
          <span className={styles.pulseRing} />
          <span className={styles.pulseRingDelay} />
          <div className={styles.radar}>
            <span className={styles.sweep} />
            <span className={styles.core} />
          </div>
        </div>
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}

export default RouteLoadingOverlay;
