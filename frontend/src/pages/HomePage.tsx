import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import MainMenuOverlay from '../components/MainMenuOverlay';
import OverlayModal from '../components/OverlayModal';
import PageShell from '../components/PageShell';
import SearchField from '../components/SearchField';
import SpaceDetailsView from '../components/SpaceDetailsView';
import { useI18n } from '../i18n/useI18n';
import { searchSpaces } from '../services/catalogService';
import type { CatalogSpace } from '../types/catalog';
import { localizeFloorLabel } from '../utils/displayNames';
import {
  catalogSpaceToSearchable,
  getCatalogSpaceLabel,
  getSearchResults,
  shouldAutofill,
} from '../utils/search';
import { getLocalizedSpaceType } from '../utils/spaceDescription';
import {
  filterSpacesByType,
  getSpaceTypeFilters,
  type SpaceTypeFilterKey,
} from '../utils/spaceTypeFilter';
import { useTheme } from '../theme/ThemeContext';
import styles from './HomePage.module.css';

type HomePageState = {
  selectedSpace?: CatalogSpace;
  fromLocationId?: number;
};

let introCompletedOnce = false;

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as HomePageState | null) ?? null;
  const selectedSpace = state?.selectedSpace ?? null;
  const fromLocationIdParam = new URLSearchParams(location.search).get('fromLocationId');
  const parsedFromLocationId =
    fromLocationIdParam && /^\d+$/.test(fromLocationIdParam)
      ? Number(fromLocationIdParam)
      : undefined;
  const fromLocationId =
    state?.fromLocationId ??
    (parsedFromLocationId && parsedFromLocationId > 0 ? parsedFromLocationId : undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<SpaceTypeFilterKey>('all');
  const [spaces, setSpaces] = useState<CatalogSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [introDone, setIntroDone] = useState(introCompletedOnce);
  const [introVisible, setIntroVisible] = useState(introCompletedOnce);
  const prevSearchTextRef = useRef('');
  const { language, languageButtonLabel, toggleLanguage, t } = useI18n();
  const { themeMode, toggleTheme } = useTheme();

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

    setIsLoadingSpaces(true);
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
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSpaces(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchText]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const typeFilters = useMemo(() => getSpaceTypeFilters(t), [t]);
  const spacesByType = useMemo(() => filterSpacesByType(spaces, typeFilter), [spaces, typeFilter]);
  const rankedSpaces = useMemo(
    () => getSearchResults(spacesByType, searchText, catalogSpaceToSearchable, getCatalogSpaceLabel),
    [spacesByType, searchText]
  );
  const filteredSpaces = useMemo(() => rankedSpaces.map((result) => result.item), [rankedSpaces]);

  useEffect(() => {
    const previousValue = prevSearchTextRef.current;
    const autofillItem = shouldAutofill(previousValue, searchText, rankedSpaces, null, () => false);

    if (autofillItem) {
      const label = getCatalogSpaceLabel(autofillItem);
      setSearchText(label);
      prevSearchTextRef.current = label;
      return;
    }

    prevSearchTextRef.current = searchText;
  }, [rankedSpaces, searchText]);

  const handleSearchChange = (value: string) => {
    prevSearchTextRef.current = searchText;
    setSearchText(value);
  };

  const openSpace = (space: CatalogSpace) => {
    navigate('/', {
      state: {
        selectedSpace: space,
        fromLocationId,
      } satisfies HomePageState,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNavigation = (space: CatalogSpace) => {
    navigate('/navigacija', {
      state: {
        initialTarget: getCatalogSpaceLabel(space),
        initialFromLocationId: fromLocationId,
      },
    });
  };

  if (selectedSpace) {
    return (
      <SpaceDetailsView
        space={selectedSpace}
        onBack={() => navigate(-1)}
        onFindClassroom={openNavigation}
        showAllMenuItems
      />
    );
  }

  return (
    <PageShell>
      <header className={introDone ? styles.headerArea : styles.headerAreaIntro}>
        <div className={styles.headerNavRowVisible}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={introDone ? styles.roundButton : styles.roundButtonHidden}
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-expanded={isMenuOpen}
              aria-label={t('common.openMenu')}
            >
              ☰
            </button>
            <button
              type="button"
              className={introDone ? styles.themeButton : styles.themeButtonHidden}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {themeMode === 'light' ? '☀️' : '🌙'}
            </button>
          </div>

          <div
            className={
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
              className={introDone ? styles.feriLogo : styles.introFeriLogo}
            />
            <h1 className={introDone ? styles.mainTitle : styles.introMainTitle}>
              {t('common.appTitle')}
            </h1>
          </div>

          <div className={styles.headerRightGroup}>
            <button
              type="button"
              className={introDone ? styles.langButton : styles.langButtonHidden}
              onClick={toggleLanguage}
              aria-label={t('common.language')}
            >
              {languageButtonLabel}
            </button>
            <button
              type="button"
              className={introDone ? styles.roundButton : styles.roundButtonHidden}
              onClick={() => setIsMapPopupOpen(true)}
              aria-label={t('home.openMap')}
            >
              🗺️
            </button>
          </div>
        </div>
      </header>

      <section className={introDone ? styles.bottomPanelVisible : styles.bottomPanelHidden}>
        <div className={styles.dragHandle} />
        <SearchField
          id="space-search"
          value={searchText}
          onChange={handleSearchChange}
          placeholder={t('home.searchPlaceholder')}
        />

        <div className={styles.typeFilters} role="group" aria-label={t('home.filterBySpaceType')}>
          {typeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={
                typeFilter === filter.key ? styles.typeFilterActive : styles.typeFilterButton
              }
              aria-pressed={typeFilter === filter.key}
              onClick={() => setTypeFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className={styles.resultsTitleRow}>
          <h2 className={styles.resultsTitle}>{t('home.resultsTitle')}</h2>
          <span className={styles.resultBadge}>{filteredSpaces.length}</span>
        </div>

        {isLoadingSpaces ? (
          <div className={styles.loadingState} data-testid="spaces-loading">
            <LoadingSpinner label={t('home.loadingSpaces')} compact />
            <div className={styles.skeletonList} aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={styles.skeletonCard} />
              ))}
            </div>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <EmptyState title={t('home.noResultsTitle')} text={t('home.noResultsText')} />
        ) : (
          <div className={styles.compactCardsList} data-testid="space-results">
            {filteredSpaces.map((space) => (
              <article
                key={space.id}
                className={styles.compactCard}
                onClick={() => openSpace(space)}
              >
                <div className={styles.compactCardContent}>
                  <div className={styles.compactCardTopLine}>
                    <h3 className={styles.compactCardTitle}>{getCatalogSpaceLabel(space)}</h3>
                    {space.type ? (
                      <span className={styles.typeChip}>{getLocalizedSpaceType(space.type, language)}</span>
                    ) : null}
                  </div>
                  {space.buildingName ? (
                    <p className={styles.compactCardMeta}>
                      {space.buildingName}
                    </p>
                  ) : null}
                  {space.floor ? (
                    <p className={styles.compactCardMeta}>
                      {localizeFloorLabel(space.floor, language)}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className={styles.inlineFindButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      openNavigation(space);
                    }}
                  >
                    {t('home.findClassroom')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <MainMenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {showScrollTop ? (
        <button
          type="button"
          className={styles.scrollTopButton}
          onClick={scrollToTop}
          aria-label={t('home.scrollToTop')}
        >
          ↑
        </button>
      ) : null}

      {isMapPopupOpen && (
        <OverlayModal title={t('home.mapTitle')} onClose={() => setIsMapPopupOpen(false)}>
          <div className={styles.mapPopupBody}>
            <img
              src="/images/zemljevidFERI.png"
              alt={t('home.mapTitle')}
              className={styles.popupImage}
            />
          </div>
        </OverlayModal>
      )}
    </PageShell>
  );
}

export default HomePage;
