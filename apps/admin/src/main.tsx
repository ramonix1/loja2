import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './index.css';
import { AdminUiThemeProvider } from './lib/admin-ui-theme';
import { PlatformUiThemeProvider } from './lib/platform-ui-theme';
import { AuthProvider } from './lib/auth-context';
import { queryClient } from './lib/query-client';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento #root não encontrado.');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminUiThemeProvider>
          <PlatformUiThemeProvider>
            <App />
          </PlatformUiThemeProvider>
        </AdminUiThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
