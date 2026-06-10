import styles from './SpaceMapPreview.module.css';

type SpaceMapPreviewProps = {
  mapImageUrl: string;
  markerX?: number;
  markerY?: number;
  alt: string;
};

function SpaceMapPreview({ mapImageUrl, markerX, markerY, alt }: SpaceMapPreviewProps) {
  const showMarker = markerX != null && markerY != null;

  return (
    <div className={styles.frame}>
      <img src={mapImageUrl} alt={alt} className={styles.image} />
      {showMarker ? (
        <>
          <span
            className={styles.markerGlow}
            style={{ left: `${markerX}%`, top: `${markerY}%` }}
            aria-hidden="true"
          />
          <span
            className={styles.marker}
            style={{ left: `${markerX}%`, top: `${markerY}%` }}
            aria-hidden="true"
          />
        </>
      ) : null}
    </div>
  );
}

export default SpaceMapPreview;
