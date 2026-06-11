import { useI18n } from '../i18n/useI18n';
import type { CatalogSpace } from '../types/catalog';
import { getSpaceDisplayName, localizeFloorLabel } from '../utils/displayNames';
import { buildSpaceDescription, getLocalizedSpaceType } from '../utils/spaceDescription';
import { getSpaceMapLocation, hasSpaceMapMarker } from '../utils/spaceMapLocation';
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
  const { language, t } = useI18n();
  const displayName = getSpaceDisplayName(space);
  const description = buildSpaceDescription(space, language, t);
  const mapLocation = getSpaceMapLocation(space);
  const infoItems = [
    space.buildingName?.trim() ? { label: t('details.building'), value: space.buildingName } : null,
    space.floor?.trim()
      ? { label: t('details.floor'), value: localizeFloorLabel(space.floor, language) }
      : null,
    space.code?.trim() ? { label: t('details.code'), value: space.code } : null,
  ].filter((item): item is { label: string; value: string } => item != null);

  return (
    <PageShell>
      <SubPageHeader
        title={t('share.nativeTitle')}
        fallbackTo="/"
        onBack={onBack}
        showAllMenuItems={showAllMenuItems}
      />

      <section className={styles.hero}>
        {space.type ? (
          <span className={styles.typeBadge}>{getLocalizedSpaceType(space.type, language)}</span>
        ) : null}
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
          {t('details.findClassroom')}
        </button>

        <section className={styles.locationSection} aria-label={t('details.locationTitle')}>
          <h2 className={styles.locationTitle}>{t('details.locationTitle')}</h2>
          <div className={styles.locationCard}>
            {mapLocation ? (
              <>
                <SpaceMapPreview
                  mapImageUrl={mapLocation.mapImageUrl}
                  markerX={mapLocation.markerX}
                  markerY={mapLocation.markerY}
                  alt={t('details.mapAlt', { name: displayName })}
                />
                {!hasSpaceMapMarker(mapLocation) ? (
                  <p className={styles.locationHint}>{t('details.markerMissing')}</p>
                ) : null}
              </>
            ) : (
              <p className={styles.locationMissing}>{t('details.mapMissing')}</p>
            )}
          </div>
        </section>
      </section>
    </PageShell>
  );
}

export default SpaceDetailsView;
