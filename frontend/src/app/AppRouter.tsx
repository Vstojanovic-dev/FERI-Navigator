import { Route, Routes } from 'react-router-dom';
import BuildingsPage from '../pages/BuildingsPage';
import HomePage from '../pages/HomePage';
import NavigationPage from '../pages/NavigationPage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/objekti" element={<BuildingsPage />} />
      <Route path="/navigacija" element={<NavigationPage />} />
      <Route path="/share/:shareCode" element={<NavigationPage />} />
    </Routes>
  );
}

export default AppRouter;
