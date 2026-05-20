import { useMemo, useState } from "react";
import { demoBuildings, getSpaceCountForBuilding, type Building } from "../data/demoData";
import { sharedStyles as styles } from "../styles/sharedStyles";

type ObjektiPageProps = {
  onBack: () => void;
  onOpenBuilding: (building: Building) => void;
};

function ObjektiPage({ onBack, onOpenBuilding }: ObjektiPageProps) {
  const [searchText, setSearchText] = useState("");

  const filteredBuildings = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return demoBuildings;
    }

    return demoBuildings.filter((building) => {
      return (
        building.name.toLowerCase().includes(query) ||
        building.description.toLowerCase().includes(query)
      );
    });
  }, [searchText]);

  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <header style={styles.subPageHeader}>
          <button type="button" style={styles.backButton} onClick={onBack}>
            ← Nazaj
          </button>
          <h1 style={styles.subPageTitle}>Objekti</h1>
        </header>

        <section style={styles.subPageContent}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Išči objekt"
              style={styles.searchInput}
            />
          </div>

          {filteredBuildings.length === 0 ? (
            <div style={styles.emptyState}>
              <strong style={styles.emptyTitle}>Ni rezultatov</strong>
              <span style={styles.emptyText}>Poskusi z drugim iskalnim nizom.</span>
            </div>
          ) : (
            <div style={styles.cardsList}>
              {filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  onOpen={() => onOpenBuilding(building)}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function BuildingCard({ building, onOpen }: { building: Building; onOpen: () => void }) {
  const spaceCount = getSpaceCountForBuilding(building.id);
  const spaceLabel = spaceCount === 1 ? "1 prostor" : `${spaceCount} prostorov`;

  return (
    <article style={styles.card} onClick={onOpen}>
      <img src={building.imageUrl} alt={building.name} style={styles.cardImage} />
      <div style={styles.cardBody}>
        <h2 style={styles.cardTitle}>{building.name}</h2>
        <p style={styles.cardText}>{building.description}</p>
        <p style={styles.cardMeta}>{spaceLabel}</p>
      </div>
    </article>
  );
}

export default ObjektiPage;
