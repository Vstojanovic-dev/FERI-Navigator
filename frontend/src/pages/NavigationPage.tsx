import { useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SubPageHeader from '../components/SubPageHeader';
import NavigationView from '../features/navigation/NavigationView';
import styles from './NavigationPage.module.css';

type NavigationPageState = {
  initialTarget?: string;
};

function NavigationPage() {
  const location = useLocation();
  const state = location.state as NavigationPageState | null;

  return (
    <PageShell>
      <section className={styles.page}>
        <SubPageHeader title="Navigacija" fallbackTo="/" />
        <NavigationView initialTarget={state?.initialTarget ?? ''} />
      </section>
    </PageShell>
  );
}

export default NavigationPage;
