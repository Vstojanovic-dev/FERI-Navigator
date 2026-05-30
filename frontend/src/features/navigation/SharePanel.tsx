import { useState } from 'react';
import styles from './SharePanel.module.css';

type SharePanelProps = {
  shareUrl: string;
  onClose: () => void;
};

function SharePanel({ shareUrl, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label="Zapri" />
      <div className={styles.sheet} role="dialog" aria-label="Deli pot">
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <span className={styles.title}>Deli pot</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Zapri"
          >
            ✕
          </button>
        </div>

        <div className={styles.urlRow}>
          <span className={styles.urlText}>{shareUrl}</span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="Kopiraj povezavo"
          >
            {copied ? '✓ Kopirano' : 'Kopiraj'}
          </button>
        </div>

        <button
          type="button"
          className={styles.qrToggle}
          onClick={() => setIsQrOpen((value) => !value)}
        >
          {isQrOpen ? 'Skrij QR kodo' : 'Prikaži QR kodo'}
        </button>

        {isQrOpen && (
          <div className={styles.qrWrap}>
            <p className={styles.urlText}>QR predogled ni na voljo v tej gradnji.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePanel;
