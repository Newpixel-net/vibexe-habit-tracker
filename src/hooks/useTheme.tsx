/**
 * Theme hook — manages dark/light mode AND color themes.
 * Supports 5 color themes: Default, Ocean, Sunset, Forest, Midnight.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ThemeMode, ColorTheme, COLOR_THEMES, ColorThemeConfig } from '../types';

// backward compat
type Theme = ThemeMode;

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  colorTheme: ColorTheme;
  themeConfig: ColorThemeConfig;
  setTheme: (theme: Theme) => void;
  setColorTheme: (ct: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const MODE_KEY = 'habit-tracker-theme';
const COLOR_KEY = 'habit-tracker-color-theme';

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

function ensureTailwindDarkModeClass() {
  const tw = (window as any).tailwind;
  if (tw) {
    tw.config = { ...(tw.config || {}), darkMode: 'class' };
    return;
  }
  if (!document.getElementById('tw-dark-config')) {
    const script = document.createElement('script');
    script.id = 'tw-dark-config';
    script.textContent = `window.tailwind = window.tailwind || {}; window.tailwind.config = Object.assign(window.tailwind.config || {}, { darkMode: 'class' });`;
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
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {}
    return 'light';
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    try {
      const stored = localStorage.getItem(COLOR_KEY);
      if (stored && stored in COLOR_THEMES) return stored as ColorTheme;
    } catch {}
    return 'default';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(theme));

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(MODE_KEY, t); } catch {}
  }, []);

  const setColorTheme = useCallback((ct: ColorTheme) => {
    setColorThemeState(ct);
    try { localStorage.setItem(COLOR_KEY, ct); } catch {}
  }, []);

  useEffect(() => { ensureTailwindDarkModeClass(); }, []);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [theme]);

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

  // Apply color theme CSS variable for gradient
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-gradient', COLOR_THEMES[colorTheme].accentGradient);
  }, [colorTheme]);

  const themeConfig = COLOR_THEMES[colorTheme];

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, colorTheme, themeConfig, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
