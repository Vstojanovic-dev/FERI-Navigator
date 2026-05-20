import { useMemo, useState, type CSSProperties } from 'react';
import { demoSpaces, getBuildingName, type Space } from '../data/demoData';

type MainPageProps = {
  introDone: boolean;
  introVisible: boolean;
  onOpenSpace: (space: Space) => void;
  onOpenObjekti: () => void;
  onMenuNavigacija: () => void;
  onMenuOFeri: () => void;
  onFindClassroom: (space: Space) => void;
};

function MainPage({
  introDone,
  introVisible,
  onOpenSpace,
  onOpenObjekti,
  onMenuNavigacija,
  onMenuOFeri,
  onFindClassroom,
}: MainPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredSpaces = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return demoSpaces;
    }

    return demoSpaces.filter((space) => {
      return (
        space.name.toLowerCase().includes(query) ||
        space.type.toLowerCase().includes(query) ||
        getBuildingName(space.buildingId).toLowerCase().includes(query) ||
        space.floor.toLowerCase().includes(query)
      );
    });
  }, [searchText]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <header style={introDone ? styles.headerArea : styles.headerAreaIntro}>
          <div style={introDone ? styles.headerNavRowVisible : styles.headerNavRowHidden}>
            <button
              type="button"
              style={introDone ? styles.roundButton : styles.roundButtonHidden}
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-expanded={isMenuOpen}
              aria-label="Odpri meni"
            >
              ☰
            </button>

            <div
              style={
                introDone
                  ? styles.headerTitleBlock
                  : introVisible
                    ? styles.introTitleBlockVisible
                    : styles.introTitleBlockHidden
              }
            >
              <img
                src="/feri-logo.png"
                alt="FERI"
                style={introDone ? styles.feriLogo : styles.introFeriLogo}
              />
              <h1 style={introDone ? styles.mainTitle : styles.introMainTitle}>Navigator</h1>
            </div>

            <button
              type="button"
              style={introDone ? styles.roundButton : styles.roundButtonHidden}
              onClick={() => setIsMapPopupOpen(true)}
              aria-label="Odpri zemljevid"
            >
              🗺️
            </button>
          </div>
        </header>

        <section style={introDone ? styles.bottomPanelVisible : styles.bottomPanelHidden}>
          <div style={styles.dragHandle} />

          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              id="space-search"
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Išči učilnico, laboratorij ali pisarno"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.resultsTitleRow}>
            <h2 style={styles.resultsTitle}>Prostori</h2>
            <span style={styles.resultBadge}>{filteredSpaces.length}</span>
          </div>

          {filteredSpaces.length === 0 ? (
            <div style={styles.emptyState}>
              <strong style={styles.emptyTitle}>Ni rezultatov</strong>
              <span style={styles.emptyText}>Poskusi z drugim nazivom prostora.</span>
            </div>
          ) : (
            <div style={styles.compactCardsList}>
              {filteredSpaces.map((space) => (
                <article
                  key={space.id}
                  style={styles.compactCard}
                  onClick={() => onOpenSpace(space)}
                >
                  <img src={space.imageUrl} alt={space.name} style={styles.compactCardImage} />

                  <div style={styles.compactCardContent}>
                    <div>
                      <div style={styles.compactCardTopLine}>
                        <h3 style={styles.compactCardTitle}>{space.name}</h3>
                        <span style={styles.typeChip}>{space.type}</span>
                      </div>
                      <p style={styles.compactCardMeta}>
                        {getBuildingName(space.buildingId)} · {space.floor}
                      </p>
                    </div>

                    <button
                      type="button"
                      style={styles.inlineFindButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onFindClassroom(space);
                      }}
                    >
                      Poišči učilnico
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {isMenuOpen && (
        <div style={styles.menuOverlay} onClick={closeMenu} role="presentation">
          <nav
            style={styles.menuPanel}
            aria-label="Glavni meni"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              style={styles.menuItem}
              onClick={() => {
                closeMenu();
                onOpenObjekti();
              }}
            >
              Vsi objekti
            </button>
            <button
              type="button"
              style={styles.menuItem}
              onClick={() => {
                closeMenu();
                onMenuNavigacija();
              }}
            >
              Navigacija
            </button>
            <button
              type="button"
              style={styles.menuItem}
              onClick={() => {
                closeMenu();
                onMenuOFeri();
              }}
            >
              O FERI
            </button>
          </nav>
        </div>
      )}

      {isMapPopupOpen && (
        <div
          style={styles.popupOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Zemljevid FERI"
        >
          <div style={styles.popupBox}>
            <h2 style={styles.popupTitle}>Zemljevid FERI</h2>
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?w=1000"
              alt="Zemljevid FERI"
              style={styles.popupImage}
            />
            <button
              type="button"
              style={styles.closeButton}
              onClick={() => setIsMapPopupOpen(false)}
            >
              Zapri
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  pageShell: {
    minHeight: '100vh',
    background: '#172033',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    padding: 0,
    width: '100%',
  },
  phoneCanvas: {
    background: '#f6f2ea',
    minHeight: '100vh',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    maxWidth: 520,
  },
  headerArea: {
    background: 'linear-gradient(135deg, #172033 0%, #26364f 58%, #445a7c 100%)',
    color: '#ffffff',
    minHeight: 158,
    padding: '18px 18px 34px',
    position: 'relative',
    overflow: 'hidden',
    transition:
      'min-height 1300ms cubic-bezier(0.22, 1, 0.36, 1), padding 1300ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  headerAreaIntro: {
    background: '#172033',
    color: '#ffffff',
    minHeight: '100vh',
    padding: '18px 18px 34px',
    position: 'relative',
    overflow: 'hidden',
    transition:
      'min-height 1300ms cubic-bezier(0.22, 1, 0.36, 1), padding 1300ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  headerNavRowHidden: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    opacity: 1,
    position: 'relative',
    transform: 'translateY(0)',
    transition: 'opacity 1000ms ease, transform 1000ms ease',
    zIndex: 4,
  },
  headerNavRowVisible: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    opacity: 1,
    position: 'relative',
    transform: 'translateY(0)',
    transition: 'opacity 1000ms ease, transform 1000ms ease',
    zIndex: 4,
  },
  roundButton: {
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    color: '#ffffff',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 19,
    fontWeight: 900,
    height: 44,
    justifyContent: 'center',
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'opacity 1000ms ease, transform 1000ms ease',
    width: 44,
  },
  roundButtonHidden: {
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    color: '#ffffff',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 19,
    fontWeight: 900,
    height: 44,
    justifyContent: 'center',
    opacity: 0,
    transform: 'translateY(18px)',
    transition: 'opacity 1000ms ease, transform 1000ms ease',
    width: 44,
  },
  headerTitleBlock: {
    left: '50%',
    opacity: 1,
    position: 'absolute',
    textAlign: 'center',
    top: -2,
    transform: 'translateX(-50%) scale(1)',
    transition:
      'top 1300ms cubic-bezier(0.22, 1, 0.36, 1), transform 1300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease',
    width: 'max-content',
    zIndex: 5,
  },
  introTitleBlockHidden: {
    left: '50%',
    opacity: 0,
    position: 'absolute',
    textAlign: 'center',
    top: '44vh',
    transform: 'translate(-50%, -50%) scale(1.48)',
    transition:
      'opacity 650ms ease, top 1300ms cubic-bezier(0.22, 1, 0.36, 1), transform 1300ms cubic-bezier(0.22, 1, 0.36, 1)',
    width: 'max-content',
    zIndex: 5,
  },
  introTitleBlockVisible: {
    left: '50%',
    opacity: 1,
    position: 'absolute',
    textAlign: 'center',
    top: '44vh',
    transform: 'translate(-50%, -50%) scale(1.65)',
    transition:
      'opacity 650ms ease, top 1300ms cubic-bezier(0.22, 1, 0.36, 1), transform 1300ms cubic-bezier(0.22, 1, 0.36, 1)',
    width: 'max-content',
    zIndex: 5,
  },
  feriLogo: {
    display: 'block',
    height: 30,
    margin: '0 auto 3px',
    objectFit: 'contain',
    transition: 'height 1300ms ease, margin 1300ms ease',
    width: 'auto',
  },
  introFeriLogo: {
    display: 'block',
    height: 34,
    margin: '0 auto 8px',
    objectFit: 'contain',
    transition: 'height 1300ms ease, margin 1300ms ease',
    width: 'auto',
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -0.6,
    lineHeight: 1,
    margin: '3px 0 0',
    transition: 'font-size 1300ms ease, letter-spacing 1300ms ease',
  },
  introMainTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -0.6,
    lineHeight: 1,
    margin: '3px 0 0',
    transition: 'font-size 1300ms ease, letter-spacing 1300ms ease',
  },
  menuOverlay: {
    alignItems: 'flex-start',
    background: 'rgba(8, 13, 24, 0.55)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    padding: '88px 18px 18px',
    position: 'fixed',
    zIndex: 1000,
  },
  menuPanel: {
    background: '#ffffff',
    borderRadius: 24,
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)',
    display: 'grid',
    gap: 8,
    maxWidth: 520,
    padding: 10,
    width: '100%',
  },
  menuItem: {
    background: '#f6f2ea',
    border: 0,
    borderRadius: 18,
    color: '#172033',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 900,
    padding: '16px 18px',
    textAlign: 'left',
  },
  bottomPanelHidden: {
    background: '#f6f2ea',
    borderRadius: '34px 34px 0 0',
    boxShadow: '0 -24px 45px rgba(8, 13, 24, 0.18)',
    marginTop: -46,
    minHeight: 'calc(100vh - 112px)',
    opacity: 0,
    padding: '12px 16px 28px',
    position: 'relative',
    transform: 'translateY(220px)',
    transition: 'opacity 1000ms ease, transform 1250ms cubic-bezier(0.22, 1, 0.36, 1)',
    zIndex: 5,
  },
  bottomPanelVisible: {
    background: '#f6f2ea',
    borderRadius: '34px 34px 0 0',
    boxShadow: '0 -24px 45px rgba(8, 13, 24, 0.18)',
    marginTop: -46,
    minHeight: 'calc(100vh - 112px)',
    opacity: 1,
    padding: '12px 16px 28px',
    position: 'relative',
    transform: 'translateY(0)',
    transition: 'opacity 1000ms ease, transform 1250ms cubic-bezier(0.22, 1, 0.36, 1)',
    zIndex: 5,
  },
  dragHandle: {
    background: '#cfc6b6',
    borderRadius: 999,
    height: 5,
    margin: '0 auto 16px',
    width: 46,
  },
  searchBox: {
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #eadfce',
    borderRadius: 22,
    boxShadow: '0 10px 25px rgba(54, 42, 27, 0.08)',
    display: 'flex',
    gap: 10,
    padding: '0 14px',
  },
  searchIcon: {
    color: '#8a7d6d',
    fontSize: 24,
    fontWeight: 900,
  },
  searchInput: {
    background: 'transparent',
    border: 0,
    color: '#172033',
    flex: 1,
    fontSize: 15,
    outline: 'none',
    padding: '15px 0',
  },
  resultsTitleRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    margin: '22px 0 12px',
  },
  resultsTitle: {
    color: '#172033',
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: -0.5,
    margin: 0,
  },
  resultBadge: {
    alignItems: 'center',
    background: '#f9b54a',
    borderRadius: 999,
    color: '#172033',
    display: 'inline-flex',
    fontSize: 13,
    fontWeight: 900,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    padding: '0 9px',
  },
  compactCardsList: {
    display: 'grid',
    gap: 12,
  },
  compactCard: {
    background: '#ffffff',
    border: '1px solid #eadfce',
    borderRadius: 24,
    boxShadow: '0 14px 28px rgba(54, 42, 27, 0.09)',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: '92px 1fr',
    overflow: 'hidden',
  },
  compactCardImage: {
    display: 'block',
    height: '100%',
    minHeight: 128,
    objectFit: 'cover',
    width: 92,
  },
  compactCardContent: {
    display: 'grid',
    gap: 9,
    padding: 13,
  },
  compactCardTopLine: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
  },
  compactCardTitle: {
    color: '#172033',
    fontSize: 19,
    fontWeight: 900,
    lineHeight: 1.05,
    margin: 0,
  },
  typeChip: {
    background: '#eef3fb',
    borderRadius: 999,
    color: '#465872',
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 900,
    padding: '5px 8px',
  },
  compactCardMeta: {
    color: '#736959',
    fontSize: 13,
    fontWeight: 700,
    margin: '5px 0 0',
  },
  inlineFindButton: {
    background: '#f9b54a',
    border: 0,
    borderRadius: 14,
    color: '#172033',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 900,
    padding: '10px 12px',
  },
  emptyState: {
    background: '#ffffff',
    borderRadius: 22,
    display: 'grid',
    gap: 5,
    padding: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#172033',
    fontSize: 17,
  },
  emptyText: {
    color: '#736959',
    fontSize: 14,
  },
  detailsTopImageWrap: {
    height: 380,
    position: 'relative',
  },
  detailsTopImage: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  floatingBackButton: {
    background: 'rgba(255, 255, 255, 0.92)',
    border: 0,
    borderRadius: 999,
    color: '#172033',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 900,
    left: 16,
    padding: '11px 14px',
    position: 'absolute',
    top: 18,
  },
  detailsSheet: {
    background: '#f6f2ea',
    borderRadius: '34px 34px 0 0',
    boxShadow: '0 -18px 42px rgba(0, 0, 0, 0.18)',
    marginTop: -36,
    minHeight: 'calc(100vh - 344px)',
    padding: '24px 18px 30px',
    position: 'relative',
  },
  detailsType: {
    color: '#f09d18',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 1.2,
    margin: '0 0 6px',
    textTransform: 'uppercase',
  },
  detailsName: {
    color: '#172033',
    fontSize: 42,
    fontWeight: 900,
    letterSpacing: -1.2,
    lineHeight: 1,
    margin: 0,
  },
  detailsDescription: {
    color: '#5f5548',
    fontSize: 16,
    lineHeight: 1.55,
    margin: '16px 0 0',
  },
  detailsInfoRow: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '1fr 1fr',
    marginTop: 18,
  },
  detailsInfoItem: {
    background: '#ffffff',
    border: '1px solid #eadfce',
    borderRadius: 20,
    padding: 14,
  },
  infoSmallLabel: {
    color: '#736959',
    display: 'block',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 4,
  },
  infoStrong: {
    color: '#172033',
    fontSize: 14,
  },
  largeNavigationButton: {
    background: '#172033',
    border: 0,
    borderRadius: 20,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 900,
    marginTop: 22,
    padding: '16px 18px',
    width: '100%',
  },
  popupOverlay: {
    alignItems: 'center',
    background: 'rgba(8, 13, 24, 0.68)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    padding: 18,
    position: 'fixed',
    zIndex: 100,
  },
  popupBox: {
    background: '#ffffff',
    borderRadius: 28,
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.28)',
    maxWidth: 420,
    padding: 18,
    width: '100%',
  },
  popupTitle: {
    color: '#172033',
    fontSize: 24,
    fontWeight: 900,
    margin: '0 0 12px',
    textAlign: 'center',
  },
  popupImage: {
    borderRadius: 20,
    display: 'block',
    height: 230,
    objectFit: 'cover',
    width: '100%',
  },
  closeButton: {
    background: '#172033',
    border: 0,
    borderRadius: 18,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 900,
    marginTop: 16,
    padding: '13px 14px',
    width: '100%',
  },
};

export default MainPage;
