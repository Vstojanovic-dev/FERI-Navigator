import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../i18n/language';
import { useI18n } from '../i18n/useI18n';
import styles from './MainMenuOverlay.module.css';

type MainMenuOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  showAllItems?: boolean;
};

function MainMenuOverlay({ isOpen, onClose, showAllItems = false }: MainMenuOverlayProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const menuItems = useMemo(
    () => [
      { path: '/', label: t('menu.home') },
      { path: '/objekti', label: t('buildings.title') },
      { path: '/navigacija', label: t('navigation.title') },
    ],
    [t]
  );

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }

    if (!isVisible) {
      return;
    }

    setIsClosing(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [isOpen, isVisible]);

  if (!isVisible) {
    return null;
  }

  const items = showAllItems
    ? menuItems
    : menuItems.filter((item) => item.path !== location.pathname);

  return (
    <div
      className={`${styles.menuOverlay} ${isClosing ? styles.menuOverlayClosing : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <nav
        className={`${styles.menuPanel} ${isClosing ? styles.menuPanelClosing : ''}`}
        aria-label={t('common.mainMenu')}
        onClick={(event) => event.stopPropagation()}
      >
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={styles.menuItem}
            onClick={() => {
              onClose();
              navigate(item.path);
            }}
          >
            {item.label}
          </button>
        ))}
        {SUPPORTED_LANGUAGES.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.menuItem}
            aria-pressed={language === option}
            onClick={() => setLanguage(option)}
          >
            {t(option === 'sl' ? 'language.sl' : 'language.en')}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default MainMenuOverlay;
