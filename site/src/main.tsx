import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'more-or-less-ui/styles.css';
import { ThemeProvider, ToastProvider } from 'more-or-less-ui';
import { App } from './App';
import { Router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="more-or-less-ui-site-theme">
      <ToastProvider>
        <Router>
          <App />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
