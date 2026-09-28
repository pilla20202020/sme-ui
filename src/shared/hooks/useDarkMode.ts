import { useEffect, useState } from 'react';

const STORAGE_KEY = 'uw-ui:dark-mode';

function getInitialDarkMode(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setDarkMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = () => setDarkMode((d) => !d);
  return { darkMode, toggle };
}
