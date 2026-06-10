import { useState } from 'react';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useI18n } from '../i18n/useI18n';
import MainMenuOverlay from './MainMenuOverlay';
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
  const { language, setLanguage, t } = useI18n();

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
          className={styles.langButton}
          onClick={() => setLanguage(language === 'sl' ? 'en' : 'sl')}
          aria-label={t('common.language')}
        >
          {language === 'sl' ? 'EN' : 'SLO'}
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
