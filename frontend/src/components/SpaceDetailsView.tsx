import type { CatalogSpace } from '../types/catalog';
import { getSpaceDisplayName } from '../utils/displayNames';
import { resolveAssetUrl } from '../services/api';
import PageShell from './PageShell';
import SubPageHeader from './SubPageHeader';
import styles from './SpaceDetailsView.module.css';

type SpaceDetailsViewProps = {
  space: CatalogSpace;
  onBack: () => void;
  onFindClassroom: (space: CatalogSpace) => void;
  showAllMenuItems?: boolean;
};

function SpaceDetailsView({
  space,
  onBack,
  onFindClassroom,
  showAllMenuItems = false,
}: SpaceDetailsViewProps) {
  const imageUrl = resolveAssetUrl(space.imageUrl) ?? '/feri-logo.png';
  const displayName = getSpaceDisplayName(space);

  return (
    <PageShell>
      <SubPageHeader
        title={displayName}
        fallbackTo="/"
        onBack={onBack}
        showAllMenuItems={showAllMenuItems}
      />
      <div className={styles.topImageWrap}>
        <img src={imageUrl} alt={space.name} className={styles.topImage} />
      </div>

      <section className={styles.sheet}>
        <p className={styles.type}>{space.type}</p>
        <h1 className={styles.name}>{displayName}</h1>
        <div className={styles.descriptionCard}>
          <p className={styles.description}>{space.description ?? 'Opis prostora bo dodan naknadno.'}</p>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Objekt</span>
            <strong className={styles.infoValue}>{space.buildingName}</strong>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nadstropje</span>
            <strong className={styles.infoValue}>{space.floor}</strong>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Oznaka</span>
            <strong className={styles.infoValue}>{space.code ?? 'Ni določeno'}</strong>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Namen</span>
            <strong className={styles.infoValue}>{space.purpose ?? space.type}</strong>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Kapaciteta</span>
            <strong className={styles.infoValue}>
              {space.capacity != null ? `${space.capacity} oseb` : 'Ni podatka'}
            </strong>
          </div>
        </div>
        {space.notes ? <p className={styles.notes}>{space.notes}</p> : null}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onFindClassroom(space)}
        >
          Poišči učilnico
        </button>
      </section>
    </PageShell>
  );
}

export default SpaceDetailsView;
