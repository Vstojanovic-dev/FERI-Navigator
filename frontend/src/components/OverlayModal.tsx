import type { PropsWithChildren } from 'react';
import styles from './OverlayModal.module.css';

type OverlayModalProps = PropsWithChildren<{
  title: string;
  onClose: () => void;
}>;

function OverlayModal({ title, onClose, children }: OverlayModalProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.box}>
        <h2 className={styles.title}>{title}</h2>
        {children}
        <button type="button" className={styles.closeButton} onClick={onClose}>
          Zapri
        </button>
      </div>
    </div>
  );
}

export default OverlayModal;
