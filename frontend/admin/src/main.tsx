import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './admin.css';
import AdminApp from './AdminApp.tsx';
import { I18nProvider } from './i18n/I18nProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AdminApp />
    </I18nProvider>
  </StrictMode>
);
