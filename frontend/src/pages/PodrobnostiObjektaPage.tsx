import type { Building, Space } from '../data/demoData';
import { sharedStyles as styles } from '../styles/sharedStyles';

type PodrobnostiObjektaPageProps = {
  building: Building;
  spaces: Space[];
  onBack: () => void;
  onOpenSpace: (space: Space) => void;
  onFindClassroom: (space: Space) => void;
};

function PodrobnostiObjektaPage({
  building,
  spaces,
  onBack,
  onOpenSpace,
  onFindClassroom,
}: PodrobnostiObjektaPageProps) {
  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <header style={styles.subPageHeader}>
          <button type="button" style={styles.backButton} onClick={onBack}>
            ← Nazaj
          </button>
          <h1 style={styles.subPageTitle}>{building.name}</h1>
        </header>

        <section style={styles.subPageContent}>
          <img src={building.imageUrl} alt={building.name} style={styles.cardImage} />
          <p style={styles.cardText}>{building.description}</p>

          <h2 style={styles.sectionTitle}>Načrt objekta</h2>
          <div style={styles.placeholderBox}>
            Tukaj bo kasneje prikazan načrt objekta (PDF ali slika tlorisa).
          </div>

          <h2 style={styles.sectionTitle}>Prostori v objektu</h2>

          {spaces.length === 0 ? (
            <div style={styles.emptyState}>
              <strong style={styles.emptyTitle}>Ni prostorov</strong>
              <span style={styles.emptyText}>Za ta objekt še ni dodanih prostorov.</span>
            </div>
          ) : (
            <div style={styles.cardsList}>
              {spaces.map((space) => (
                <div key={space.id} style={styles.spaceRow}>
                  <div style={styles.spaceRowInfo}>
                    <h3 style={styles.spaceRowTitle}>{space.name}</h3>
                    <p style={styles.spaceRowMeta}>
                      {space.type} · {space.floor}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => onOpenSpace(space)}
                    >
                      Podrobnosti
                    </button>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => onFindClassroom(space)}
                    >
                      Poišči
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default PodrobnostiObjektaPage;
