import { useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SubPageHeader from '../components/SubPageHeader';
import NavigationView from '../features/navigation/NavigationView';

type NavigationPageState = {
  initialTarget?: string;
};

function NavigationPage() {
  const location = useLocation();
  const state = location.state as NavigationPageState | null;

  return (
    <PageShell>
      <SubPageHeader title="Navigacija" fallbackTo="/" />
      <NavigationView initialTarget={state?.initialTarget ?? ''} />
    </PageShell>
  );
}

export default NavigationPage;
