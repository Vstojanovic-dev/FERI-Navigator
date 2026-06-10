import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageShell from '../components/PageShell';
import SearchField from '../components/SearchField';
import SpaceDetailsView from '../components/SpaceDetailsView';
import SubPageHeader from '../components/SubPageHeader';
import { useI18n } from '../i18n/useI18n';
import { resolveAssetUrl } from '../services/api';
import { fetchBuildings, fetchBuildingSpaces, searchSpaces } from '../services/catalogService';
import type { BuildingSummary, CatalogSpace } from '../types/catalog';
import { getBuildingKey, getBuildingPlanImageUrl } from '../utils/buildingPlanImages';
import { formatSpaceCount, getSpaceDisplayName, localizeFloorLabel } from '../utils/displayNames';
import {
  buildingToSearchable,
  catalogSpaceToSearchable,
  getCatalogSpaceLabel,
  getSearchResults,
  normalizeText,
} from '../utils/search';
import { getLocalizedSpaceType } from '../utils/spaceDescription';
import styles from './BuildingsPage.module.css';

type BuildingsPageState = {
  selectedBuilding?: BuildingSummary;
  selectedSpace?: CatalogSpace;
};

const DEMO_SPACES_BY_BUILDING: Record<string, CatalogSpace[]> = {
  C: [
    {
      id: 9001,
      name: 'C-101',
      type: 'classroom',
      buildingId: 0,
      buildingName: 'Objekt C',
      floor: 'Pritličje',
      description: null,
      imageUrl: null,
      code: 'C-101',
    },
    {
      id: 9002,
      name: 'C-102',
      type: 'laboratory',
      buildingId: 0,
      buildingName: 'Objekt C',
      floor: 'Pritličje',
      description: null,
      imageUrl: null,
      code: 'C-102',
    },
  ],
  E: [
    {
      id: 9101,
      name: 'E-201',
      type: 'classroom',
      buildingId: 0,
      buildingName: 'Objekt E',
      floor: '1. nadstropje',
      description: null,
      imageUrl: null,
      code: 'E-201',
    },
  ],
  F: [
    {
      id: 9201,
      name: 'F-001',
      type: 'classroom',
      buildingId: 0,
      buildingName: 'Objekt F',
      floor: 'Pritličje',
      description: null,
      imageUrl: null,
      code: 'F-001',
    },
  ],
  G: [
    {
      id: 9301,
      name: 'G-001',
      type: 'classroom',
      buildingId: 0,
      buildingName: 'Objekt G',
      floor: 'Pritličje',
      description: null,
      imageUrl: null,
      code: 'G-001',
    },
    {
      id: 9302,
      name: 'Galerija',
      type: 'classroom',
      buildingId: 0,
      buildingName: 'Objekt G',
      floor: '4. nadstropje',
      description: null,
      imageUrl: null,
      code: 'G-GAL',
    },
  ],
  G2: [
    {
      id: 9401,
      name: 'G2-101',
      type: 'classroom',
      buildingId: 0,
      buildingName: 'Objekt G2',
      floor: '1. nadstropje',
      description: null,
      imageUrl: null,
      code: 'G2-101',
    },
  ],
  G3: [
    {
      id: 9501,
      name: 'G3-301',
      type: 'laboratory',
      buildingId: 0,
      buildingName: 'Objekt G3',
      floor: 'Pritličje',
      description: null,
      imageUrl: null,
      code: 'G3-301',
    },
  ],
};

function BuildingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const state = (location.state as BuildingsPageState | null) ?? null;
  const selectedBuilding = state?.selectedBuilding ?? null;
  const selectedSpace = state?.selectedSpace ?? null;
  const [searchText, setSearchText] = useState('');
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [allSpaces, setAllSpaces] = useState<CatalogSpace[]>([]);
  const [buildingSpaces, setBuildingSpaces] = useState<CatalogSpace[]>([]);
  const [buildingSpaceSearch, setBuildingSpaceSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetchBuildings()
      .then((items) => {
        if (!cancelled) {
          setBuildings(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBuildings([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    searchSpaces('')
      .then((items) => {
        if (!cancelled) {
          setAllSpaces(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllSpaces([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setBuildingSpaceSearch('');
  }, [selectedBuilding]);

  useEffect(() => {
    if (!selectedBuilding) {
      setBuildingSpaces([]);
      return;
    }

    let cancelled = false;

    fetchBuildingSpaces(selectedBuilding.id)
      .then((items) => {
        if (!cancelled) {
          setBuildingSpaces(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBuildingSpaces([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBuilding]);

  const spaceCountByBuildingId = useMemo(() => {
    const counts = new Map<number, number>();

    for (const space of allSpaces) {
      if (space.buildingId > 0) {
        counts.set(space.buildingId, (counts.get(space.buildingId) ?? 0) + 1);
      }
    }

    for (const building of buildings) {
      if (counts.has(building.id)) {
        continue;
      }
      const demoSpaces = DEMO_SPACES_BY_BUILDING[getBuildingKey(building.name)];
      if (demoSpaces) {
        counts.set(building.id, demoSpaces.length);
      }
    }

    return counts;
  }, [allSpaces, buildings]);

  const getBuildingSpaceCount = useCallback(
    (building: BuildingSummary) => {
      const counted = spaceCountByBuildingId.get(building.id);
      if (counted != null) {
        return counted;
      }
      return building.spaceCount;
    },
    [spaceCountByBuildingId]
  );

  const filteredBuildings = useMemo(() => {
    const sortBySpaceCount = (left: BuildingSummary, right: BuildingSummary) =>
      getBuildingSpaceCount(right) - getBuildingSpaceCount(left);

    if (!normalizeText(searchText)) {
      return [...buildings].sort(sortBySpaceCount);
    }

    const ranked = getSearchResults(buildings, searchText, (building) => {
      const fields = buildingToSearchable(building);
      return {
        ...fields,
        description: [fields.description, formatSpaceCount(getBuildingSpaceCount(building), language)]
          .filter(Boolean)
          .join(' '),
      };
    });

    return ranked
      .sort((left, right) => {
        if (left.rank !== right.rank) {
          return left.rank - right.rank;
        }
        return sortBySpaceCount(left.item, right.item);
      })
      .map((result) => result.item);
  }, [buildings, getBuildingSpaceCount, language, searchText]);

  const openSpaceNavigation = (space: CatalogSpace) => {
    navigate('/navigacija', { state: { initialTarget: getSpaceDisplayName(space) } });
  };

  if (selectedSpace) {
    return (
      <SpaceDetailsView
        space={selectedSpace}
        onBack={() => navigate(-1)}
        onFindClassroom={openSpaceNavigation}
        showAllMenuItems
      />
    );
  }

  if (selectedBuilding) {
    const planImageUrl =
      getBuildingPlanImageUrl(selectedBuilding.name) ?? resolveAssetUrl(selectedBuilding.imageUrl);
    const spacesForBuilding =
      buildingSpaces.length > 0
        ? buildingSpaces
        : DEMO_SPACES_BY_BUILDING[getBuildingKey(selectedBuilding.name)] ?? [];
    const filteredBuildingSpaces = getSearchResults(
      spacesForBuilding,
      buildingSpaceSearch,
      catalogSpaceToSearchable,
      getCatalogSpaceLabel
    ).map((result) => result.item);

    return (
      <PageShell>
        <SubPageHeader title={selectedBuilding.name} fallbackTo="/objekti" showAllMenuItems />
        <section className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('buildings.planTitle')}</h2>
          <div className={styles.placeholderBox}>
            {planImageUrl ? (
              <img
                src={planImageUrl}
                alt={t('buildings.planAlt', { name: selectedBuilding.name })}
                className={styles.planImage}
              />
            ) : (
              <span>{t('buildings.noPlan')}</span>
            )}
          </div>

          <h2 className={styles.sectionTitle}>{t('buildings.spacesTitle')}</h2>

          {spacesForBuilding.length > 0 ? (
            <SearchField
              id="building-space-search"
              value={buildingSpaceSearch}
              onChange={setBuildingSpaceSearch}
              placeholder={t('buildings.spaceSearchPlaceholder')}
            />
          ) : null}

          {spacesForBuilding.length === 0 ? (
            <EmptyState title={t('buildings.noSpacesTitle')} text={t('buildings.noSpacesText')} />
          ) : filteredBuildingSpaces.length === 0 ? (
            <EmptyState title={t('buildings.noResultsTitle')} text={t('buildings.noResultsText')} />
          ) : (
            <div className={styles.spaceCardsList}>
              {filteredBuildingSpaces.map((space) => (
                <article
                  key={space.id}
                  className={styles.spaceCard}
                  onClick={() =>
                    navigate('/objekti', {
                      state: {
                        selectedBuilding,
                        selectedSpace: space,
                      } satisfies BuildingsPageState,
                    })
                  }
                >
                  <div className={styles.spaceCardTopLine}>
                    <h3 className={styles.spaceCardTitle}>{getCatalogSpaceLabel(space)}</h3>
                    {space.type ? (
                      <span className={styles.spaceCardType}>{getLocalizedSpaceType(space.type, language)}</span>
                    ) : null}
                  </div>
                  {space.floor ? (
                    <p className={styles.spaceCardMeta}>
                      {localizeFloorLabel(space.floor, language)}
                    </p>
                  ) : null}
                  {space.code ? <p className={styles.spaceCardCode}>{space.code}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SubPageHeader title={t('buildings.title')} fallbackTo="/" />
      <section className={styles.content}>
        <SearchField
          value={searchText}
          onChange={setSearchText}
          placeholder={t('buildings.searchPlaceholder')}
        />

        {filteredBuildings.length === 0 ? (
          <EmptyState
            title={t('buildings.searchResultsEmptyTitle')}
            text={t('buildings.searchResultsEmptyText')}
          />
        ) : (
          <div className={styles.cardsList} data-testid="building-results">
            {filteredBuildings.map((building) => {
              const buildingImageUrl =
                getBuildingPlanImageUrl(building.name) ?? resolveAssetUrl(building.imageUrl);

              return (
                <article
                  key={building.id}
                  className={styles.card}
                  onClick={() =>
                    navigate('/objekti', {
                      state: { selectedBuilding: building } satisfies BuildingsPageState,
                    })
                  }
                >
                  <div className={styles.cardImageHalf}>
                    {buildingImageUrl ? (
                      <img
                        src={buildingImageUrl}
                        alt={building.name}
                        className={styles.cardPlanImage}
                      />
                    ) : (
                      <div className={styles.cardPlanImagePlaceholder}>{t('buildings.planPlaceholder')}</div>
                    )}
                  </div>
                  <div className={styles.cardBodyHalf}>
                    <div className={styles.cardTextContent}>
                      <h2 className={styles.cardTitle}>{building.name}</h2>
                      <p className={styles.cardMeta}>
                        {formatSpaceCount(getBuildingSpaceCount(building), language)}
                      </p>
                      <p className={styles.cardHint}>
                        {language === 'sl' ? 'Ogled načrta in prostorov' : 'View plan and spaces'}
                      </p>
                    </div>
                    <span className={styles.cardChevron} aria-hidden="true">
                      ›
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default BuildingsPage;
