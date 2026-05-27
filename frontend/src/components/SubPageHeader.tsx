import { useBackNavigation } from '../hooks/useBackNavigation';
import styles from './SubPageHeader.module.css';

type SubPageHeaderProps = {
  title: string;
  fallbackTo: string;
};

function SubPageHeader({ title, fallbackTo }: SubPageHeaderProps) {
  const handleBack = useBackNavigation(fallbackTo);

  return (
    <header className={styles.header}>
      <button type="button" className={styles.backButton} onClick={handleBack}>
        &lt; Nazaj
      </button>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}

export default SubPageHeader;
