import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './MainMenuOverlay.module.css';

type MainMenuOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  showAllItems?: boolean;
};

const MENU_ITEMS = [
  { path: '/', label: 'Domov' },
  { path: '/objekti', label: 'Vsi objekti' },
  { path: '/navigacija', label: 'Navigacija' },
];

function MainMenuOverlay({ isOpen, onClose, showAllItems = false }: MainMenuOverlayProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

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
    ? MENU_ITEMS
    : MENU_ITEMS.filter((item) => item.path !== location.pathname);

  return (
    <div
      className={`${styles.menuOverlay} ${isClosing ? styles.menuOverlayClosing : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <nav
        className={`${styles.menuPanel} ${isClosing ? styles.menuPanelClosing : ''}`}
        aria-label="Glavni meni"
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
      </nav>
    </div>
  );
}

export default MainMenuOverlay;
