import type { CatalogSpace } from '../types/catalog';
import { resolveAssetUrl } from '../services/api';
import PageShell from './PageShell';
import styles from './SpaceDetailsView.module.css';

type SpaceDetailsViewProps = {
  space: CatalogSpace;
  onBack: () => void;
  onFindClassroom: (space: CatalogSpace) => void;
};

function SpaceDetailsView({ space, onBack, onFindClassroom }: SpaceDetailsViewProps) {
  const imageUrl = resolveAssetUrl(space.imageUrl) ?? '/feri-logo.png';

  return (
    <PageShell>
      <div className={styles.topImageWrap}>
        <img src={imageUrl} alt={space.name} className={styles.topImage} />
        <button type="button" className={styles.backButton} onClick={onBack}>
          &lt; Nazaj
        </button>
      </div>

      <section className={styles.sheet}>
        <p className={styles.type}>{space.type}</p>
        <h1 className={styles.name}>{space.name}</h1>
        <p className={styles.description}>{space.description ?? ''}</p>

        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Objekt</span>
            <strong className={styles.infoValue}>{space.buildingName}</strong>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nadstropje</span>
            <strong className={styles.infoValue}>{space.floor}</strong>
          </div>
        </div>

        <button type="button" className={styles.primaryButton} onClick={() => onFindClassroom(space)}>
          Poišči učilnico
        </button>
      </section>
    </PageShell>
  );
}

export default SpaceDetailsView;
