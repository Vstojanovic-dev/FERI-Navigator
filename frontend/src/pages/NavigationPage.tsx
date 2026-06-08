import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SubPageHeader from '../components/SubPageHeader';
import { useI18n } from '../i18n/useI18n';
import NavigationView from '../features/navigation/NavigationView';
import { ApiError } from '../services/api';
import { fetchLocation, resolveShare } from '../services/navigationService';
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
  const { t } = useI18n();
  const state = location.state as NavigationPageState | null;

  const [sharedRoute, setSharedRoute] = useState<SharedRouteState | null>(null);
  const [sharedInitialTarget, setSharedInitialTarget] = useState('');
  const [shareError, setShareError] = useState('');
  const [isResolvingShare, setIsResolvingShare] = useState(false);

  useEffect(() => {
    const pathname = location.pathname;
    const match = pathname.match(/^\/share\/([a-zA-Z0-9]+)$/);
    if (!match) {
      return;
    }

    const shareCode = match[1];
    setIsResolvingShare(true);

    const resolve = async () => {
      try {
        const shareData = await resolveShare(shareCode);

        let toLabel = '';
        if (shareData.toLocationId) {
          try {
            const toLoc = await fetchLocation(shareData.toLocationId);
            toLabel = toLoc.displayName;
          } catch {
            toLabel = '';
          }
        } else if (shareData.targetType === 'wc') {
          toLabel = t('navigation.nearestWc');
        }

        setSharedRoute(shareData);
        setSharedInitialTarget(toLabel);
        navigate('/navigacija', { replace: true, state: null });
      } catch (error) {
        if (error instanceof ApiError && error.code === 'SHARE_NOT_FOUND') {
          setShareError(t('navigation.invalidShare'));
        } else {
          setShareError(t('navigation.sharedRouteLoadError'));
        }
      } finally {
        setIsResolvingShare(false);
      }
    };

    void resolve();
  }, [location.pathname, navigate, t]);

  return (
    <PageShell>
      <section className={styles.page}>
        <SubPageHeader title={t('navigation.title')} fallbackTo="/" compact />

        {isResolvingShare && <p className={styles.loadingText}>{t('navigation.loadingSharedRoute')}</p>}

        {shareError && <p className={styles.errorText}>{shareError}</p>}

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
