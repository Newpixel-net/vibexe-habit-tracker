/**
 * Theme hook
 * Manages dark/light/system theme with localStorage persistence.
 *
 * Sandpack/Vibexe loads Tailwind via CDN. By default Tailwind uses the
 * `media` strategy for `dark:` variants, which ignores the `.dark` class.
 * We configure `tailwind.config = { darkMode: 'class' }` at startup so
 * the CDN runtime honours the class on <html>.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'habit-tracker-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

/**
 * Ensure Tailwind CDN uses class-based dark mode.
 * The CDN exposes `window.tailwind` — setting `.config.darkMode` before
 * the first style evaluation makes `dark:` classes respond to the `.dark`
 * class on <html>. We also inject a <script> tag that sets the config
 * early in case the CDN hasn't loaded yet when this runs.
 */
function ensureTailwindDarkModeClass() {
  const tw = (window as any).tailwind;
  if (tw) {
    tw.config = {
      ...(tw.config || {}),
      darkMode: 'class',
    };
    return;
  }

  // CDN not yet loaded — inject a <script> so the config is ready early
  if (!document.getElementById('tw-dark-config')) {
    const script = document.createElement('script');
    script.id = 'tw-dark-config';
    script.textContent = `
      window.tailwind = window.tailwind || {};
      window.tailwind.config = Object.assign(window.tailwind.config || {}, { darkMode: 'class' });
    `;
    document.head.prepend(script);
  }
}

function applyThemeClass(resolved: 'light' | 'dark') {
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch { /* ignore */ }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(theme));

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
  }, []);

  // One-time: configure Tailwind CDN for class-based dark mode
  useEffect(() => {
    ensureTailwindDarkModeClass();
  }, []);

  // Apply dark class to <html> whenever theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [theme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
