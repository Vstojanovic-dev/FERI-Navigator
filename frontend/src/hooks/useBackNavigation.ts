import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useBackNavigation(fallbackTo: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key !== 'default' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  }, [fallbackTo, location.key, navigate]);
}
