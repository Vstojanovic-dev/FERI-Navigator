import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SubPageHeader from '../components/SubPageHeader';
import NavigationView from '../features/navigation/NavigationView';
import { resolveShare, fetchLocation } from '../services/navigationService';
import { ApiError } from '../services/api';
import styles from './NavigationPage.module.css';

type NavigationPageState = {
  initialTarget?: string;
};

type SharedRouteState = {
  fromLocationId: number;
  toLocationId?: number;
  targetType?: string;
  allowElevator: boolean;
};

function NavigationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as NavigationPageState | null;

  const [sharedRoute, setSharedRoute] = useState<SharedRouteState | null>(null);
  const [sharedInitialTarget, setSharedInitialTarget] = useState('');
  const [shareError, setShareError] = useState('');
  const [isResolvingShare, setIsResolvingShare] = useState(false);

  // Bootstrap iz /share/<code> URL-a
  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/share\/([a-zA-Z0-9]+)$/);
    if (!match) return;

    const shareCode = match[1];
    setIsResolvingShare(true);

    const resolve = async () => {
      try {
        const shareData = await resolveShare(shareCode);

        // Povuci naziv ciljne lokacije za prikaz u polju
        let toLabel = '';
        if (shareData.toLocationId) {
          try {
            const toLoc = await fetchLocation(shareData.toLocationId);
            toLabel = toLoc.displayName;
          } catch {
            // Ako lokacija nije dostupna, nastavljamo bez labela
          }
        } else if (shareData.targetType === 'wc') {
          toLabel = 'Najbližji WC';
        }

        setSharedRoute(shareData);
        setSharedInitialTarget(toLabel);

        // Promeni URL na /navigacija bez osvježavanja
        navigate('/navigacija', { replace: true, state: null });
      } catch (err) {
        if (err instanceof ApiError && err.code === 'SHARE_NOT_FOUND') {
          setShareError('Ta povezava ni veljavna ali je potekla.');
        } else {
          setShareError('Napaka pri nalaganju deljene poti.');
        }
      } finally {
        setIsResolvingShare(false);
      }
    };

    resolve();
    // Namerno samo ob mountu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell>
      <section className={styles.page}>
        <SubPageHeader title="Navigacija" fallbackTo="/" compact />

        {isResolvingShare && (
          <p className={styles.loadingText}>Nalagam deljeno pot...</p>
        )}

        {shareError && (
          <p className={styles.errorText}>{shareError}</p>
        )}

        {!isResolvingShare && (
          <NavigationView
            initialTarget={sharedRoute ? sharedInitialTarget : (state?.initialTarget ?? '')}
            sharedFromLocationId={sharedRoute?.fromLocationId}
            sharedToLocationId={sharedRoute?.toLocationId}
            sharedTargetType={sharedRoute?.targetType}
            sharedAllowElevator={sharedRoute?.allowElevator}
          />
        )}
      </section>
    </PageShell>
  );
}

export default NavigationPage;
