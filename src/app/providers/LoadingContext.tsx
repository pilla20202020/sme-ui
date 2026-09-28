import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ── Module-level fetch interceptor ─────────────────────────────────────────
// Patched immediately so ALL fetch calls (including those during initial
// render / React Query hydration) are captured before any component mounts.

type Listener = (activeCount: number) => void;

let _activeRequests = 0;
const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach((fn) => fn(_activeRequests));
}

if (typeof window !== 'undefined') {
  const _originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    _activeRequests++;
    _notify();
    try {
      return await _originalFetch.apply(window, args);
    } finally {
      _activeRequests = Math.max(0, _activeRequests - 1);
      _notify();
    }
  };
}

function subscribeFetch(fn: Listener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Context ────────────────────────────────────────────────────────────────

interface LoadingContextValue {
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue>({ isLoading: false });

export function useGlobalLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    return subscribeFetch((active) => setCount(active));
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading: count > 0 }}>{children}</LoadingContext.Provider>
  );
}
