import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { theme } from './theme';
import { AppShellLayout } from './components/AppShellLayout/AppShellLayout';
import { AuthProvider } from './context/AuthContext';
import { WeekProvider } from './context/WeekContext';
import { AIAnalysisProvider } from './context/AIAnalysisContext';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-center" />
      <AuthProvider>
        <BrowserRouter>
          <WeekProvider>
            <AIAnalysisProvider>
              <AppShellLayout>
                <Router />
              </AppShellLayout>
            </AIAnalysisProvider>
          </WeekProvider>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}