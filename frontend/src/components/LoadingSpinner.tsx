import styles from './LoadingSpinner.module.css';

type LoadingSpinnerProps = {
  label?: string;
  compact?: boolean;
  size?: 'default' | 'small';
};

function LoadingSpinner({ label, compact = false, size = 'default' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${styles.wrap} ${compact ? styles.compact : styles.inline}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`${styles.spinner} ${size === 'small' ? styles.spinnerSmall : ''}`}
        aria-hidden="true"
      />
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}

export default LoadingSpinner;
