import { Navigate, Route, Routes } from 'react-router-dom';
import TrackedAppsPage from './pages/TrackedAppsPage';
import MonitoringPage from './pages/MonitoringPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrackedAppsPage />} />
      <Route path="/apps/:id" element={<MonitoringPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
