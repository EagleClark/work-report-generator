import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { theme } from './theme';
import { AppShellLayout } from './components/AppShellLayout/AppShellLayout';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <BrowserRouter>
        <AppShellLayout>
          <Router />
        </AppShellLayout>
      </BrowserRouter>
    </MantineProvider>
  );
}
