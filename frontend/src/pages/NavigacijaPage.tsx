import { useState, type CSSProperties } from "react";
import { sharedStyles as styles } from "../styles/sharedStyles";

type NavigacijaPageProps = {
  initialTarget: string;
  onBack: () => void;
};

const demoSteps = [
  "Pot je pripravljena.",
  "1. Pojdi naravnost do glavnega hodnika.",
  "2. Zavij desno pri stopnišču.",
  "3. Nadaljuj do izbrane učilnice.",
];

function NavigacijaPage({ initialTarget, onBack }: NavigacijaPageProps) {
  const [startLocation, setStartLocation] = useState("");
  const [targetLocation, setTargetLocation] = useState(initialTarget);
  const [routeVisible, setRouteVisible] = useState(false);
  const [formError, setFormError] = useState("");

  const handleShowRoute = () => {
    const start = startLocation.trim();
    const target = targetLocation.trim();

    if (!start) {
      setFormError("Vnesi začetno lokacijo.");
      setRouteVisible(false);
      return;
    }

    if (!target) {
      setFormError("Vnesi cilj.");
      setRouteVisible(false);
      return;
    }

    setFormError("");
    setRouteVisible(true);
  };

  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <header style={styles.subPageHeader}>
          <button type="button" style={styles.backButton} onClick={onBack}>
            ← Nazaj
          </button>
          <h1 style={styles.subPageTitle}>Navigacija</h1>
        </header>

        <section style={pageStyles.content}>
          <label style={pageStyles.label} htmlFor="start-location">
            Začetna lokacija
          </label>
          <input
            id="start-location"
            type="text"
            value={startLocation}
            onChange={(event) => setStartLocation(event.target.value)}
            placeholder="Vnesi začetno lokacijo"
            style={pageStyles.input}
          />

          <label style={pageStyles.label} htmlFor="target-location">
            Ciljna lokacija
          </label>
          <input
            id="target-location"
            type="text"
            value={targetLocation}
            onChange={(event) => setTargetLocation(event.target.value)}
            placeholder="Vnesi cilj"
            style={pageStyles.input}
          />

          <button type="button" style={pageStyles.primaryButton} onClick={handleShowRoute}>
            Prikaži pot
          </button>

          {formError && <p style={pageStyles.errorText}>{formError}</p>}

          <div style={pageStyles.mapPlaceholder} aria-label="Demo prikaz zemljevida">
            <p style={pageStyles.mapLabel}>Demo prikaz zemljevida / načrta</p>
            <MapDemo routeVisible={routeVisible} />
          </div>

          {routeVisible && (
            <div style={pageStyles.stepsBox}>
              {demoSteps.map((step) => (
                <p key={step} style={pageStyles.stepText}>
                  {step}
                </p>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function MapDemo({ routeVisible }: { routeVisible: boolean }) {
  return (
    <svg viewBox="0 0 320 220" style={pageStyles.mapSvg} role="img" aria-hidden="true">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d9e2ec" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="220" fill="#f8fafc" />
      <rect width="320" height="220" fill="url(#grid)" />

      <rect x="24" y="34" width="72" height="152" rx="8" fill="#e8eef6" stroke="#c5d3e8" />
      <rect x="112" y="34" width="88" height="152" rx="8" fill="#eef3fb" stroke="#c5d3e8" />
      <rect x="216" y="34" width="80" height="152" rx="8" fill="#e8eef6" stroke="#c5d3e8" />

      <line x1="96" y1="110" x2="112" y2="110" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
      <line x1="200" y1="110" x2="216" y2="110" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

      {routeVisible && (
        <path
          d="M 60 170 C 60 130, 160 130, 160 90 S 250 70, 256 54"
          fill="none"
          stroke="#f9b54a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
      )}

      <circle cx="60" cy="170" r="9" fill="#172033" />
      <text x="60" y="174" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">
        A
      </text>

      <circle cx="256" cy="54" r="9" fill="#f09d18" />
      <text x="256" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">
        B
      </text>

      <circle cx="156" cy="110" r="5" fill="#64748b" />
      <circle cx="248" cy="140" r="5" fill="#64748b" />
    </svg>
  );
}

const pageStyles: Record<string, CSSProperties> = {
  content: {
    display: "grid",
    gap: 10,
    padding: "16px 16px 28px",
  },
  label: {
    color: "#172033",
    fontSize: 14,
    fontWeight: 900,
    marginTop: 4,
  },
  input: {
    background: "#ffffff",
    border: "1px solid #eadfce",
    borderRadius: 18,
    boxSizing: "border-box",
    color: "#172033",
    fontSize: 15,
    outline: "none",
    padding: "14px 16px",
    width: "100%",
  },
  primaryButton: {
    background: "#172033",
    border: 0,
    borderRadius: 18,
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 900,
    marginTop: 6,
    padding: "14px 16px",
    width: "100%",
  },
  errorText: {
    color: "#b45309",
    fontSize: 13,
    fontWeight: 800,
    margin: "2px 0 0",
  },
  mapPlaceholder: {
    background: "#ffffff",
    border: "1px solid #eadfce",
    borderRadius: 24,
    boxShadow: "0 14px 28px rgba(54, 42, 27, 0.09)",
    marginTop: 10,
    overflow: "hidden",
    padding: "12px 12px 10px",
  },
  mapLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
    margin: "0 0 8px",
    textAlign: "center",
  },
  mapSvg: {
    display: "block",
    height: "auto",
    width: "100%",
  },
  stepsBox: {
    background: "#ffffff",
    border: "1px solid #eadfce",
    borderRadius: 20,
    display: "grid",
    gap: 8,
    marginTop: 4,
    padding: "14px 16px",
  },
  stepText: {
    color: "#172033",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.45,
    margin: 0,
  },
};

export default NavigacijaPage;
