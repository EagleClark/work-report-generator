import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { WeeklyReportPage } from './pages/WeeklyReport.page';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/weekly-report" element={<WeeklyReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
