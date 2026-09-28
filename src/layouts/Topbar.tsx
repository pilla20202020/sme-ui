import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { FiMenu, FiUser } from 'react-icons/fi';
import { useTheme } from '@/app/providers/ThemeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useLayoutShell } from './LayoutShellContext';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import corenrollLogo from '@/assets/image/corenrollogo.svg';
import corenrollLogoDark from '@/assets/image/corenrolllogolight.svg';
import styles from './Topbar/Topbar.module.css';
interface TopbarProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  compactMobile?: boolean;
}

export function Topbar({ title, subtitle, extra, compactMobile = false }: TopbarProps) {
  const { T, darkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();
  const { displayName, email } = useCurrentUser();
  const { openSidebar } = useLayoutShell();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (
        profileRef.current &&
        e.target instanceof Node &&
        !profileRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const hideTitleOnMobile = compactMobile && isMobile;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="app-topbar"
      style={{
        position: 'sticky',
        top: 0,
        height: 64,
        zIndex: 30,
        background: T.bgCard,
        borderBottom: '1px solid ' + T.border,
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px 12px 30px',
        gap: 12,
        boxShadow: T.shadow,
      }}
    >
      {hideTitleOnMobile && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={darkMode ? corenrollLogoDark : corenrollLogo}
            alt="CoreEnroll"
            style={{ height: 32, width: 120, display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}

      <div style={{ flex: 1, display: hideTitleOnMobile ? 'none' : 'block' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.textMuted }}>{subtitle}</div>}
      </div>

      {!isMobile && (
        <a href={import.meta.env.VITE_ADMIN_SITE_URL} className={styles.backToAdmin}>
          <span className={styles.backIcon}>←</span>
          <span>Back to Admin</span>
        </a>
      )}

      {!isMobile && <div style={{ fontSize: 12, color: T.textMuted }}>{today}</div>}

      {!isMobile && extra}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {isMobile && (
          <button
            onClick={openSidebar}
            title="Open menu"
            aria-label="Open menu"
            style={{
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 16,
              color: T.text,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiMenu size={18} />
          </button>
        )}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: T.bgHover,
            border: '1px solid ' + T.border,
            borderRadius: 8,
            padding: '7px 12px',
            cursor: 'pointer',
            fontSize: 16,
            color: T.text,
            transition: 'background 0.15s',
            lineHeight: 1,
          }}
        >
          {darkMode ? '☀' : '☾'}
        </button>

        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            title="User profile"
            aria-label="User profile"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: T.sky,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiUser size={18} />
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 220,
                borderRadius: 12,
                border: '1px solid ' + T.border,
                background: T.bgCard,
                boxShadow: T.shadowMd,
                padding: 12,
                zIndex: 50,
                animation: 'topbarProfileIn 0.18s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{displayName}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{email}</div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid ' + T.border,
                  background: T.bgHover,
                  color: T.red,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
