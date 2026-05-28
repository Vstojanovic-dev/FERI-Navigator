import styles from './EmptyState.module.css';

type EmptyStateProps = {
  title: string;
  text: string;
};

function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className={styles.box}>
      <strong className={styles.title}>{title}</strong>
      <span className={styles.text}>{text}</span>
    </div>
  );
}

export default EmptyState;
