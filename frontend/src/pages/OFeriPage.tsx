import type { CSSProperties } from "react";
import { sharedStyles as styles } from "../styles/sharedStyles";

type OFeriPageProps = {
  onBack: () => void;
};

const infoCards = [
  "Fakulteta za elektrotehniko, računalništvo in informatiko",
  "Univerza v Mariboru",
  "Študijski prostori, laboratoriji in predavalnice",
];

function OFeriPage({ onBack }: OFeriPageProps) {
  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <header style={styles.subPageHeader}>
          <button type="button" style={styles.backButton} onClick={onBack}>
            ← Nazaj
          </button>
          <h1 style={styles.subPageTitle}>O FERI</h1>
        </header>

        <section style={pageStyles.content}>
          <div style={pageStyles.heroCard}>
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?w=1000"
              alt="FERI"
              style={pageStyles.heroImage}
            />
          </div>

          <p style={pageStyles.lead}>
            FERI je Fakulteta za elektrotehniko, računalništvo in informatiko Univerze v Mariboru.
            Fakulteta združuje študijske programe, raziskovalno delo, laboratorije, predavalnice in
            druge prostore, ki jih uporabljajo študenti, zaposleni in obiskovalci.
          </p>

          <div style={pageStyles.infoCardsList}>
            {infoCards.map((text) => (
              <div key={text} style={pageStyles.infoCard}>
                <span style={pageStyles.infoCardText}>{text}</span>
              </div>
            ))}
          </div>

          <p style={pageStyles.footerText}>
            Aplikacija FERI Navigator je namenjena lažjemu iskanju učilnic, laboratorijev, pisarn in
            drugih pomembnih točk znotraj objektov fakultete.
          </p>
        </section>
      </section>
    </main>
  );
}

const pageStyles: Record<string, CSSProperties> = {
  content: {
    display: "grid",
    gap: 16,
    padding: "16px 16px 28px",
  },
  heroCard: {
    background: "#ffffff",
    border: "1px solid #eadfce",
    borderRadius: 24,
    boxShadow: "0 14px 28px rgba(54, 42, 27, 0.09)",
    overflow: "hidden",
  },
  heroImage: {
    display: "block",
    height: 190,
    objectFit: "cover",
    width: "100%",
  },
  lead: {
    color: "#5f5548",
    fontSize: 16,
    lineHeight: 1.55,
    margin: 0,
  },
  infoCardsList: {
    display: "grid",
    gap: 10,
  },
  infoCard: {
    background: "#ffffff",
    border: "1px solid #eadfce",
    borderRadius: 20,
    padding: "14px 16px",
  },
  infoCardText: {
    color: "#172033",
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  footerText: {
    color: "#736959",
    fontSize: 14,
    lineHeight: 1.5,
    margin: "4px 0 0",
  },
};

export default OFeriPage;
