import { useTheme } from '@/app/providers/ThemeContext';

export function UnauthorizedPage() {
  const { T } = useTheme();

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        color: T.text,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, margin: 0, opacity: 0.3 }}>403</h1>
        <h2 style={{ margin: '8px 0 16px' }}>Access Denied</h2>
        <p style={{ opacity: 0.7 }}>
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}



