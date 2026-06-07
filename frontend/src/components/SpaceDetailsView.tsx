import type { CatalogSpace } from '../types/catalog';
import { getSpaceDisplayName } from '../utils/displayNames';
import { buildSpaceDescription } from '../utils/spaceDescription';
import { getSpaceMapLocation } from '../utils/spaceMapLocation';
import PageShell from './PageShell';
import SpaceMapPreview from './SpaceMapPreview';
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
  const mapLocation = getSpaceMapLocation(space);
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

        {mapLocation ? (
          <section className={styles.locationSection} aria-label="Lokacija prostora">
            <h2 className={styles.locationTitle}>Lokacija prostora</h2>
            <div className={styles.locationCard}>
              <SpaceMapPreview
                mapImageUrl={mapLocation.mapImageUrl}
                markerX={mapLocation.markerX}
                markerY={mapLocation.markerY}
                alt={`Lokacija prostora ${displayName} na načrtu objekta`}
              />
            </div>
          </section>
        ) : null}
      </section>
    </PageShell>
  );
}

export default SpaceDetailsView;
