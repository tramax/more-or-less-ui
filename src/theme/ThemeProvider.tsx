'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey,
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    
    if (disableTransitionOnChange) {
      root.style.setProperty('--theme-transition', 'none');
      // Force reflow
      root.offsetHeight;
    }

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-theme', systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      root.setAttribute('data-theme', newTheme);
      setResolvedTheme(newTheme);
    }

    if (disableTransitionOnChange) {
      // Re-enable transitions after a tick
      requestAnimationFrame(() => {
        root.style.removeProperty('--theme-transition');
      });
    }
  }, [disableTransitionOnChange]);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    
    // Read from localStorage if available
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored) {
        setThemeState(stored);
        applyTheme(stored);
        return;
      }
    }
    
    // Apply default
    applyTheme(defaultTheme);
  }, [applyTheme, defaultTheme, storageKey]);

  // Watch system preference changes
  useEffect(() => {
    if (!enableSystem || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (_e: MediaQueryListEvent) => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [enableSystem, theme, applyTheme]);

  // Persist theme changes
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
  }, [applyTheme, storageKey]);

  // Don't render children until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}