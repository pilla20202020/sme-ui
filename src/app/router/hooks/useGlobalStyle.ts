import { useEffect } from 'react';
import { getGlobalStyle } from '@/shared/theme';
import type { ThemeTokens } from '@/shared/theme';

const STYLE_ELEMENT_ID = 'app-global-style';

export function useGlobalStyle(T: ThemeTokens): void {
  useEffect(() => {
    let styleEl = document.getElementById(STYLE_ELEMENT_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = getGlobalStyle(T);
  }, [T]);
}
