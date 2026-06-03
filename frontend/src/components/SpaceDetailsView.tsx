import type { CatalogSpace } from '../types/catalog';
import { getSpaceDisplayName } from '../utils/displayNames';
import { buildSpaceDescription } from '../utils/spaceDescription';
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
  const displayName = getSpaceDisplayName(space);
  const description = buildSpaceDescription(space);
  const infoItems = [
    space.buildingName?.trim() ? { label: 'Objekt', value: space.buildingName } : null,
    space.floor?.trim() ? { label: 'Nadstropje', value: space.floor } : null,
    space.code?.trim() ? { label: 'Oznaka', value: space.code } : null,
  ].filter((item): item is { label: string; value: string } => item != null);

  return (
    <PageShell>
      <SubPageHeader
        title={displayName}
        fallbackTo="/"
        onBack={onBack}
        showAllMenuItems={showAllMenuItems}
      />

      <section className={styles.hero}>
        {space.type ? <span className={styles.typeBadge}>{space.type}</span> : null}
        <h1 className={styles.name}>{displayName}</h1>
      </section>

      <section className={styles.sheet}>
        <div className={styles.descriptionCard}>
          <p className={styles.description}>{description}</p>
        </div>

        {infoItems.length > 0 ? (
          <div className={styles.infoRow}>
            {infoItems.map((item) => (
              <div key={item.label} className={styles.infoItem}>
                <span className={styles.infoLabel}>{item.label}</span>
                <strong className={styles.infoValue}>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

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
