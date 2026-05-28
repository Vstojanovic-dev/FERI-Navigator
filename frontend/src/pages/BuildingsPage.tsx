import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageShell from '../components/PageShell';
import SearchField from '../components/SearchField';
import SpaceDetailsView from '../components/SpaceDetailsView';
import SubPageHeader from '../components/SubPageHeader';
import { resolveAssetUrl } from '../services/api';
import { fetchBuildings, fetchBuildingSpaces } from '../services/catalogService';
import type { BuildingSummary, CatalogSpace } from '../types/catalog';
import styles from './BuildingsPage.module.css';

type BuildingsPageState = {
  selectedBuilding?: BuildingSummary;
  selectedSpace?: CatalogSpace;
};

function BuildingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as BuildingsPageState | null) ?? null;
  const selectedBuilding = state?.selectedBuilding ?? null;
  const selectedSpace = state?.selectedSpace ?? null;
  const [searchText, setSearchText] = useState('');
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
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

  const filteredBuildings = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return buildings;
    }

    const scoreBuilding = (building: BuildingSummary) => {
      const name = building.name.toLowerCase();
      const description = (building.description ?? '').toLowerCase();
      const spaceCountText = String(building.spaceCount);

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
        return left.name.localeCompare(right.name);
      });
  }, [buildings, searchText]);

  const openSpaceNavigation = (space: CatalogSpace) => {
    navigate('/navigacija', { state: { initialTarget: space.name } });
  };

  if (selectedSpace) {
    return (
      <SpaceDetailsView
        space={selectedSpace}
        onBack={() =>
          navigate('/objekti', {
            replace: true,
            state: selectedBuilding ? ({ selectedBuilding } satisfies BuildingsPageState) : null,
          })
        }
        onFindClassroom={openSpaceNavigation}
        showAllMenuItems
      />
    );
  }

  if (selectedBuilding) {
    return (
      <PageShell>
        <SubPageHeader title={selectedBuilding.name} fallbackTo="/objekti" showAllMenuItems />
        <section className={styles.content}>
          <img
            src={resolveAssetUrl(selectedBuilding.imageUrl) ?? '/feri-logo.png'}
            alt={selectedBuilding.name}
            className={styles.heroImage}
          />
          <p className={styles.description}>{selectedBuilding.description ?? ''}</p>

          <h2 className={styles.sectionTitle}>Načrt objekta</h2>
          <div className={styles.placeholderBox}>
            Tukaj bo kasneje prikazan načrt objekta (PDF ali slika tlorisa).
          </div>

          <h2 className={styles.sectionTitle}>Prostori v objektu</h2>

          {buildingSpaces.length === 0 ? (
            <EmptyState title="Ni prostorov" text="Za ta objekt še ni dodanih prostorov." />
          ) : (
            <div className={styles.cardsList}>
              {buildingSpaces.map((space) => (
                <div key={space.id} className={styles.spaceRow}>
                  <div className={styles.spaceRowInfo}>
                    <h3 className={styles.spaceRowTitle}>{space.name}</h3>
                    <p className={styles.spaceRowMeta}>
                      {space.type} · {space.floor}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() =>
                        navigate('/objekti', {
                          replace: true,
                          state: {
                            selectedBuilding,
                            selectedSpace: space,
                          } satisfies BuildingsPageState,
                        })
                      }
                    >
                      Podrobnosti
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => openSpaceNavigation(space)}
                    >
                      Poišči
                    </button>
                  </div>
                </div>
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
                    replace: true,
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
                  <p className={styles.cardText}>{building.description ?? ''}</p>
                  <p className={styles.cardMeta}>
                    {building.spaceCount === 1 ? '1 prostor' : `${building.spaceCount} prostorov`}
                  </p>
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
