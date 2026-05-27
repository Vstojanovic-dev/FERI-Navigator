import { Route, Routes } from 'react-router-dom';
import AboutPage from '../pages/AboutPage';
import BuildingsPage from '../pages/BuildingsPage';
import HomePage from '../pages/HomePage';
import NavigationPage from '../pages/NavigationPage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/objekti" element={<BuildingsPage />} />
      <Route path="/navigacija" element={<NavigationPage />} />
      <Route path="/o-feri" element={<AboutPage />} />
    </Routes>
  );
}

export default AppRouter;
