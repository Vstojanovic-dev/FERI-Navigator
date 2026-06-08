import type { PropsWithChildren } from 'react';
import { useI18n } from '../i18n/useI18n';
import styles from './OverlayModal.module.css';

type OverlayModalProps = PropsWithChildren<{
  title: string;
  onClose: () => void;
}>;

function OverlayModal({ title, onClose, children }: OverlayModalProps) {
  const { t } = useI18n();

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.box}>
        <h2 className={styles.title}>{title}</h2>
        {children}
        <button type="button" className={styles.closeButton} onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}

export default OverlayModal;
