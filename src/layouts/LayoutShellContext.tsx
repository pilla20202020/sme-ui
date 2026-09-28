import { createContext, useContext, type ReactNode } from 'react';

interface LayoutShellContextValue {
  openSidebar: () => void;
  closeSidebar: () => void;
}

const LayoutShellContext = createContext<LayoutShellContextValue | null>(null);

interface LayoutShellProviderProps {
  value: LayoutShellContextValue;
  children: ReactNode;
}

export function LayoutShellProvider({ value, children }: LayoutShellProviderProps) {
  return <LayoutShellContext.Provider value={value}>{children}</LayoutShellContext.Provider>;
}

export function useLayoutShell() {
  const ctx = useContext(LayoutShellContext);
  return {
    openSidebar: ctx?.openSidebar ?? (() => {}),
    closeSidebar: ctx?.closeSidebar ?? (() => {}),
  };
}



