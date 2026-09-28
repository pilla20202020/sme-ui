import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { HiX } from 'react-icons/hi';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { AuthProvider, AuthGate } from '@/app/providers/AuthContext';
import { LoadingProvider } from '@/app/providers/LoadingContext';
import { useDarkMode } from '@/shared/hooks';
import { AppRouter } from '@/app/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  const { darkMode, toggle } = useDarkMode();
  return (
    <LoadingProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider darkMode={darkMode} toggleDarkMode={toggle}>
          <AuthProvider>
            <BrowserRouter>
              <AuthGate>
                <AppRouter />
              </AuthGate>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '8px', fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== 'loading' && (
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      aria-label="Dismiss notification"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: 2,
                        marginLeft: 4,
                        color: 'inherit',
                        opacity: 0.5,
                      }}
                    >
                      <HiX size={14} />
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>
      </QueryClientProvider>
    </LoadingProvider>
  );
}
