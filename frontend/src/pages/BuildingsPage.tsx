import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageShell from '../components/PageShell';
import SearchField from '../components/SearchField';
import SpaceDetailsView from '../components/SpaceDetailsView';
import SubPageHeader from '../components/SubPageHeader';
import { resolveAssetUrl } from '../services/api';
import { fetchBuildings, fetchBuildingSpaces, searchSpaces } from '../services/catalogService';
import type { BuildingSummary, CatalogSpace } from '../types/catalog';
import { formatSpaceCount, getSpaceDisplayName } from '../utils/displayNames';
import styles from './BuildingsPage.module.css';

type BuildingsPageState = {
  selectedBuilding?: BuildingSummary;
  selectedSpace?: CatalogSpace;
};

const BUILDING_PLAN_MAP: Record<string, string> = {
  'Objekt C': '/maps/objekt_c.png',
  'Objekt E': '/maps/objekt_e.png',
  'Objekt F': '/maps/objekt_f_p.png',
  'Objekt G': '/maps/objekt_g_p.png',
  'Objekt G2': '/maps/objekt_g_2_n.png',
  'Objekt G3': '/maps/g3_pritlicje.png',
};

const DEMO_SPACES_BY_BUILDING: Record<string, CatalogSpace[]> = {
  'Objekt C': [
    { id: 9001, name: 'C-101', type: 'Učilnica', buildingId: 0, buildingName: 'Objekt C', floor: 'Pritličje', description: 'Predavanja in vaje za manjše skupine.', imageUrl: '/feri-logo.png', code: 'C-101', purpose: 'Predavanja', capacity: 45, notes: 'Projektor in bela tabla.' },
    { id: 9002, name: 'C-102', type: 'Laboratorij', buildingId: 0, buildingName: 'Objekt C', floor: 'Pritličje', description: 'Laboratorijske vaje.', imageUrl: '/feri-logo.png', code: 'C-102', purpose: 'Laboratorij', capacity: 24, notes: 'Računalniška učilnica.' },
  ],
  'Objekt E': [
    { id: 9101, name: 'E-201', type: 'Učilnica', buildingId: 0, buildingName: 'Objekt E', floor: '1. nadstropje', description: 'Klasična učilnica za predavanja.', imageUrl: '/feri-logo.png', code: 'E-201', purpose: 'Predavanja', capacity: 60 },
  ],
  'Objekt F': [
    { id: 9201, name: 'F-001', type: 'Učilnica', buildingId: 0, buildingName: 'Objekt F', floor: 'Pritličje', description: 'Učilnica za vaje.', imageUrl: '/feri-logo.png', code: 'F-001', purpose: 'Vaje', capacity: 32 },
  ],
  'Objekt G': [
    { id: 9301, name: 'G-001', type: 'Predavalnica', buildingId: 0, buildingName: 'Objekt G', floor: 'Pritličje', description: 'Večja predavalnica.', imageUrl: '/feri-logo.png', code: 'G-001', purpose: 'Predavanja', capacity: 120 },
    { id: 9302, name: 'Galerija', type: 'Učilnica', buildingId: 0, buildingName: 'Objekt G', floor: '4. nadstropje', description: 'Galerijski prostor za dogodke in predstavitve.', imageUrl: '/feri-logo.png', code: 'G-GAL', purpose: 'Dogodki', capacity: 80 },
  ],
  'Objekt G2': [
    { id: 9401, name: 'G2-101', type: 'Učilnica', buildingId: 0, buildingName: 'Objekt G2', floor: '1. nadstropje', description: 'Srednje velika učilnica.', imageUrl: '/feri-logo.png', code: 'G2-101', purpose: 'Predavanja', capacity: 40 },
  ],
  'Objekt G3': [
    { id: 9501, name: 'G3-301', type: 'Laboratorij', buildingId: 0, buildingName: 'Objekt G3', floor: 'Pritličje', description: 'Laboratorij za praktične vaje.', imageUrl: '/feri-logo.png', code: 'G3-301', purpose: 'Laboratorij', capacity: 20 },
  ],
};

function BuildingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as BuildingsPageState | null) ?? null;
  const selectedBuilding = state?.selectedBuilding ?? null;
  const selectedSpace = state?.selectedSpace ?? null;
  const [searchText, setSearchText] = useState('');
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [allSpaces, setAllSpaces] = useState<CatalogSpace[]>([]);
  const [buildingSpaces, setBuildingSpaces] = useState<CatalogSpace[]>([]);

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
      const demoSpaces = DEMO_SPACES_BY_BUILDING[building.name];
      if (demoSpaces) {
        counts.set(building.id, demoSpaces.length);
      }
    }

    return counts;
  }, [allSpaces, buildings]);

  const getBuildingSpaceCount = (building: BuildingSummary) => {
    const counted = spaceCountByBuildingId.get(building.id);
    if (counted != null) {
      return counted;
    }
    return building.spaceCount;
  };

  const filteredBuildings = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const sortBySpaceCount = (left: BuildingSummary, right: BuildingSummary) =>
      getBuildingSpaceCount(right) - getBuildingSpaceCount(left);

    if (!query) {
      return [...buildings].sort(sortBySpaceCount);
    }

    const scoreBuilding = (building: BuildingSummary) => {
      const name = building.name.toLowerCase();
      const description = (building.description ?? '').toLowerCase();
      const spaceCountText = formatSpaceCount(getBuildingSpaceCount(building)).toLowerCase();

      if (name.startsWith(query)) {
        return 0;
      }
      if (name.includes(query)) {
        return 1;
      }
      if (description.includes(query) || spaceCountText.includes(query)) {
        return 2;
      }
      return 3;
    };

    return [...buildings]
      .filter((building) => scoreBuilding(building) < 3)
      .sort((left, right) => {
        const byScore = scoreBuilding(left) - scoreBuilding(right);
        if (byScore !== 0) {
          return byScore;
        }
        return sortBySpaceCount(left, right);
      });
  }, [buildings, searchText, spaceCountByBuildingId]);

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
    const planImageUrl = BUILDING_PLAN_MAP[selectedBuilding.name] ?? resolveAssetUrl(selectedBuilding.imageUrl);
    const spacesForBuilding =
      buildingSpaces.length > 0
        ? buildingSpaces
        : DEMO_SPACES_BY_BUILDING[selectedBuilding.name] ?? [];

    return (
      <PageShell>
        <SubPageHeader title={selectedBuilding.name} fallbackTo="/objekti" showAllMenuItems />
        <section className={styles.content}>
          <h2 className={styles.sectionTitle}>Načrt objekta</h2>
          <div className={styles.placeholderBox}>
            {planImageUrl ? (
              <img src={planImageUrl} alt={`Načrt objekta ${selectedBuilding.name}`} className={styles.planImage} />
            ) : (
              <span>Za ta objekt trenutno ni dodanega načrta.</span>
            )}
          </div>

          <h2 className={styles.sectionTitle}>Prostori v objektu</h2>

          {spacesForBuilding.length === 0 ? (
            <EmptyState title="Ni prostorov" text="Za ta objekt še ni dodanih prostorov." />
          ) : (
            <div className={styles.spaceCardsList}>
              {spacesForBuilding.map((space) => (
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
                  <img
                    src={resolveAssetUrl(space.imageUrl) ?? '/feri-logo.png'}
                    alt={space.name}
                    className={styles.spaceCardImage}
                  />
                  <h3 className={styles.spaceCardTitle}>{getSpaceDisplayName(space)}</h3>
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
      <SubPageHeader title="Objekti" fallbackTo="/" />
      <section className={styles.content}>
        <SearchField value={searchText} onChange={setSearchText} placeholder="Išči objekt" />

        {filteredBuildings.length === 0 ? (
          <EmptyState title="Ni rezultatov" text="Poskusi z drugim iskalnim nizom." />
        ) : (
          <div className={styles.cardsList} data-testid="building-results">
            {filteredBuildings.map((building) => (
              <article
                key={building.id}
                className={styles.card}
                onClick={() =>
                  navigate('/objekti', {
                    state: { selectedBuilding: building } satisfies BuildingsPageState,
                  })
                }
              >
                <img
                  src={resolveAssetUrl(building.imageUrl) ?? '/feri-logo.png'}
                  alt={building.name}
                  className={styles.cardImage}
                />
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{building.name}</h2>
                  <p className={styles.cardMeta}>{formatSpaceCount(getBuildingSpaceCount(building))}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default BuildingsPage;
