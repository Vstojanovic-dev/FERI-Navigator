import type { Space } from '../data/demoData';
import { sharedStyles as styles } from '../styles/sharedStyles';

type UcilnicaPageProps = {
  space: Space;
  buildingName: string;
  onBack: () => void;
  onFindClassroom: (space: Space) => void;
};

function UcilnicaPage({ space, buildingName, onBack, onFindClassroom }: UcilnicaPageProps) {
  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <div style={styles.detailsTopImageWrap}>
          <img src={space.imageUrl} alt={space.name} style={styles.detailsTopImage} />
          <button type="button" style={styles.floatingBackButton} onClick={onBack}>
            ← Nazaj
          </button>
        </div>

        <section style={styles.detailsSheet}>
          <p style={styles.detailsType}>{space.type}</p>
          <h1 style={styles.detailsName}>{space.name}</h1>
          <p style={styles.detailsDescription}>{space.description}</p>

          <div style={styles.detailsInfoRow}>
            <DetailInfoItem label="Objekt" value={buildingName} />
            <DetailInfoItem label="Nadstropje" value={space.floor} />
          </div>

          <button type="button" style={styles.primaryButton} onClick={() => onFindClassroom(space)}>
            Poišči učilnico
          </button>
        </section>
      </section>
    </main>
  );
}

function DetailInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailsInfoItem}>
      <span style={styles.infoSmallLabel}>{label}</span>
      <strong style={styles.infoStrong}>{value}</strong>
    </div>
  );
}

export default UcilnicaPage;
