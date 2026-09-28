import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { ThemeTokens } from '@/shared/theme';
import { lightTokens, darkTokens } from '@/shared/theme';

interface ThemeContextValue {
  T: ThemeTokens;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function ThemeProvider({ children, darkMode, toggleDarkMode }: ThemeProviderProps) {
  const T = darkMode ? darkTokens : lightTokens;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ T, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}



