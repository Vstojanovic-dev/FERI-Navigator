import styles from './SpaceMapPreview.module.css';

type SpaceMapPreviewProps = {
  mapImageUrl: string;
  markerX: number;
  markerY: number;
  alt: string;
};

function SpaceMapPreview({ mapImageUrl, markerX, markerY, alt }: SpaceMapPreviewProps) {
  return (
    <div className={styles.frame}>
      <img src={mapImageUrl} alt={alt} className={styles.image} />
      <span
        className={styles.marker}
        style={{ left: `${markerX}%`, top: `${markerY}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

export default SpaceMapPreview;
