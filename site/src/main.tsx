import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'more-or-less-ui/styles.css';
import { ThemeProvider, ToastProvider } from 'more-or-less-ui';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
