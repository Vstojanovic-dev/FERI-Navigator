import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './SharePanel.module.css';

type SharePanelProps = {
  shareUrl: string;
  onClose: () => void;
};

function SharePanel({ shareUrl, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState('');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    }
  };

  const handleShare = async () => {
    setShareHint('');
    if (canNativeShare) {
      try {
        await navigator.share({
          title: 'FERI Navigator',
          text: 'Pot po FERI',
          url: shareUrl,
        });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === 'AbortError') {
          return;
        }
      }
    }

    await handleCopy();
    setShareHint('Povezava je kopirana v odložišče.');
    window.setTimeout(() => setShareHint(''), 2500);
  };

  return (
    <div className={styles.overlay} role="presentation">
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label="Zapri" />
      <div className={styles.modal} role="dialog" aria-label="Deli pot">
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
          <input
            className={styles.urlInput}
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Povezava do poti"
          />
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="Kopiraj povezavo"
          >
            {copied ? '✓ Kopirano' : 'Kopiraj'}
          </button>
        </div>

        <button type="button" className={styles.shareButton} onClick={handleShare}>
          <span className={styles.shareButtonIcon} aria-hidden="true">
            ↗
          </span>
          Deli
        </button>

        {shareHint && <p className={styles.shareHint}>{shareHint}</p>}

        <button
          type="button"
          className={styles.qrToggle}
          onClick={() => setIsQrOpen((value) => !value)}
        >
          {isQrOpen ? 'Skrij QR kodo' : 'Prikaži QR kodo'}
        </button>

        {isQrOpen && (
          <div className={styles.qrWrap}>
            <QRCodeSVG value={shareUrl} size={168} level="M" className={styles.qrCode} />
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePanel;
