import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import OverlayModal from '../components/OverlayModal';
import PageShell from '../components/PageShell';
import SearchField from '../components/SearchField';
import SpaceDetailsView from '../components/SpaceDetailsView';
import { resolveAssetUrl } from '../services/api';
import { searchSpaces } from '../services/catalogService';
import type { CatalogSpace } from '../types/catalog';
import styles from './HomePage.module.css';

type HomePageState = {
  selectedSpace?: CatalogSpace;
};

let introCompletedOnce = false;

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as HomePageState | null) ?? null;
  const selectedSpace = state?.selectedSpace ?? null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [spaces, setSpaces] = useState<CatalogSpace[]>([]);
  const [introDone, setIntroDone] = useState(introCompletedOnce);
  const [introVisible, setIntroVisible] = useState(introCompletedOnce);

  useEffect(() => {
    if (introCompletedOnce) {
      return;
    }

    const showTimer = window.setTimeout(() => setIntroVisible(true), 120);
    const moveTimer = window.setTimeout(() => {
      introCompletedOnce = true;
      setIntroDone(true);
    }, 1700);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(moveTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    searchSpaces(searchText)
      .then((items) => {
        if (!cancelled) {
          setSpaces(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSpaces([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchText]);

  const filteredSpaces = useMemo(() => spaces, [spaces]);

  const openSpace = (space: CatalogSpace) => {
    navigate('/', { replace: true, state: { selectedSpace: space } satisfies HomePageState });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNavigation = (space: CatalogSpace) => {
    navigate('/navigacija', { state: { initialTarget: space.name } });
  };

  if (selectedSpace) {
    return (
      <SpaceDetailsView
        space={selectedSpace}
        onBack={() => navigate('/', { replace: true, state: null })}
        onFindClassroom={openNavigation}
      />
    );
  }

  return (
    <PageShell>
      <header className={introDone ? styles.headerArea : styles.headerAreaIntro}>
        <div className={styles.headerNavRowVisible}>
          <button
            type="button"
            className={introDone ? styles.roundButton : styles.roundButtonHidden}
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-expanded={isMenuOpen}
            aria-label="Odpri meni"
          >
            ☰
          </button>

          <div
            className={
              introDone
                ? styles.headerTitleBlock
                : introVisible
                  ? styles.introTitleBlockVisible
                  : styles.introTitleBlockHidden
            }
          >
            <img src="/feri-logo.png" alt="FERI" className={introDone ? styles.feriLogo : styles.introFeriLogo} />
            <h1 className={introDone ? styles.mainTitle : styles.introMainTitle}>Navigator</h1>
          </div>

          <button
            type="button"
            className={introDone ? styles.roundButton : styles.roundButtonHidden}
            onClick={() => setIsMapPopupOpen(true)}
            aria-label="Odpri zemljevid"
          >
            🗺️
          </button>
        </div>
      </header>

      <section className={introDone ? styles.bottomPanelVisible : styles.bottomPanelHidden}>
        <div className={styles.dragHandle} />
        <SearchField
          id="space-search"
          value={searchText}
          onChange={setSearchText}
          placeholder="Išči učilnico, laboratorij ali pisarno"
        />

        <div className={styles.resultsTitleRow}>
          <h2 className={styles.resultsTitle}>Prostori</h2>
          <span className={styles.resultBadge}>{filteredSpaces.length}</span>
        </div>

        {filteredSpaces.length === 0 ? (
          <EmptyState title="Ni rezultatov" text="Poskusi z drugim nazivom prostora." />
        ) : (
          <div className={styles.compactCardsList} data-testid="space-results">
            {filteredSpaces.map((space) => (
              <article key={space.id} className={styles.compactCard} onClick={() => openSpace(space)}>
                <img
                  src={resolveAssetUrl(space.imageUrl) ?? '/feri-logo.png'}
                  alt={space.name}
                  className={styles.compactCardImage}
                />

                <div className={styles.compactCardContent}>
                  <div>
                    <div className={styles.compactCardTopLine}>
                      <h3 className={styles.compactCardTitle}>{space.name}</h3>
                      <span className={styles.typeChip}>{space.type}</span>
                    </div>
                    <p className={styles.compactCardMeta}>
                      {space.buildingName} · {space.floor}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.inlineFindButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      openNavigation(space);
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

      {isMenuOpen && (
        <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} role="presentation">
          <nav className={styles.menuPanel} aria-label="Glavni meni" onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.menuItem} onClick={() => navigate('/objekti')}>
              Vsi objekti
            </button>
            <button type="button" className={styles.menuItem} onClick={() => navigate('/navigacija')}>
              Navigacija
            </button>
            <button type="button" className={styles.menuItem} onClick={() => navigate('/o-feri')}>
              O FERI
            </button>
          </nav>
        </div>
      )}

      {isMapPopupOpen && (
        <OverlayModal title="Zemljevid FERI" onClose={() => setIsMapPopupOpen(false)}>
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?w=1000"
            alt="Zemljevid FERI"
            className={styles.popupImage}
          />
        </OverlayModal>
      )}
    </PageShell>
  );
}

export default HomePage;
