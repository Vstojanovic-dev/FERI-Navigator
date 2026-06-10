import { useState } from 'react';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useI18n } from '../i18n/useI18n';
import MainMenuOverlay from './MainMenuOverlay';
import { useTheme } from '../theme/ThemeContext';
import styles from './SubPageHeader.module.css';

type SubPageHeaderProps = {
  title: string;
  fallbackTo: string;
  showAllMenuItems?: boolean;
  onBack?: () => void;
  compact?: boolean;
};

function SubPageHeader({
  title,
  fallbackTo,
  showAllMenuItems = false,
  onBack,
  compact = false,
}: SubPageHeaderProps) {
  const handleBack = useBackNavigation(fallbackTo);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { languageButtonLabel, toggleLanguage, t } = useI18n();
  const { themeMode, toggleTheme } = useTheme();

  return (
    <>
      <header className={`${styles.header} ${compact ? styles.headerCompact : ''}`}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack ?? handleBack}
          aria-label={t('common.back')}
        >
          ←
        </button>
        <h1 className={styles.title}>{title}</h1>
        <button
          type="button"
          className={styles.themeButton}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {themeMode === 'light' ? '☀️' : '🌙'}
        </button>
        <button
          type="button"
          className={styles.langButton}
          onClick={toggleLanguage}
          aria-label={t('common.language')}
        >
          {languageButtonLabel}
        </button>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-expanded={isMenuOpen}
          aria-label={t('common.openMenu')}
        >
          ☰
        </button>
      </header>
      <MainMenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        showAllItems={showAllMenuItems}
      />
    </>
  );
}

export default SubPageHeader;
