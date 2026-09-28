import { useState } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';
import { NAV_ITEMS } from '@/shared/constants';
import type { NavItem } from '@/shared/types/nav';
import { useLayoutShell } from './LayoutShellContext';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import logoLight from '@/assets/image/corenrollogo.svg';
import logoDark from '@/assets/image/corenrolllogolight.svg';
import favicon from '@/assets/image/favicon-light.png';

interface SidebarProps {
  activeNav: string;
  onNavTo: (id: string) => void;
  /** Defaults to the full static NAV_ITEMS list — see PageLayout's navItems doc. */
  navItems?: NavItem[];
  isMobileDrawer?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export function Sidebar({
  activeNav,
  onNavTo,
  navItems = NAV_ITEMS,
  isMobileDrawer = false,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { T, darkMode } = useTheme();
  const { closeSidebar } = useLayoutShell();
  const [hovered, setHovered] = useState<string | null>(null);
  const [collapseHovered, setCollapseHovered] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const showCollapsedTooltip = isCollapsed && !isMobileDrawer;

  const sidebarBackground =
    isMobileDrawer && !darkMode
      ? T.bgCard
      : darkMode
        ? T.bgSidebar
        : 'linear-gradient(133deg, #0567bc, #1597b8) no-repeat fixed';

  return (
    <div
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: sidebarBackground,
        borderRight: isMobileDrawer && !darkMode ? '1px solid ' + T.border : 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        boxShadow: T.shadowMd,
        padding: '16px 12px',
        alignItems: isMobileDrawer ? 'stretch' : 'center',
      }}
      className={`sidebarwrapper ${!isMobileDrawer && isCollapsed ? 'sidebarwrapper-collapsed' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          className="logo-wrapper"
          style={{
            background: 'transparent',
            padding: isCollapsed && !isMobileDrawer ? 0 : '0px 0px 0px 25px',
            width: isCollapsed && !isMobileDrawer ? 'auto' : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isCollapsed && !isMobileDrawer ? (
            <img
              src={favicon}
              alt="CoreEnroll"
              style={{
                height: 32,
                width: 32,
                display: 'block',
                objectFit: 'contain',
                position: 'relative',
                left: '6px',
              }}
            />
          ) : (
            <img
              src={!darkMode && isMobileDrawer ? logoLight : logoDark}
              alt="CoreEnroll"
              style={{ height: 36, width: 60, display: 'block', objectFit: 'contain' }}
            />
          )}
        </div>
        {!isMobileDrawer && (
          <button
            onClick={onToggleCollapse}
            className="sidebar-collapse-btn"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onMouseEnter={() => setCollapseHovered(true)}
            onMouseLeave={() => setCollapseHovered(false)}
            style={{
              position: 'relative',
              top: '50px',
              width: 32,
              height: 32,
              borderRadius: 50,
              border: darkMode
                ? `1px solid ${collapseHovered ? '#fff' : 'rgba(255,255,255,0.08)'}`
                : `4px solid #fff`,
              background: darkMode
                ? collapseHovered
                  ? T.indigoLight
                  : T.bgCard
                : collapseHovered
                  ? '#076CBB'
                  : '#076CBB',
              color: darkMode ? (collapseHovered ? '#fff' : T.textSub) : '#ffffff',
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'all 0.18s ease',
            }}
          >
            {isCollapsed ? <HiOutlineChevronRight size={16} /> : <HiOutlineChevronLeft size={16} />}
          </button>
        )}
        {isMobileDrawer && (
          <button
            onClick={closeSidebar}
            className="sidebar-close-btn"
            title="Close menu"
            style={{
              borderRadius: 8,
              background: T.bgCard,
              color: T.text,
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: isMobileDrawer ? '16px 0 12px' : '12px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {navItems.map((item) => {
          if (item.separator) {
            if (isCollapsed && !isMobileDrawer) {
              return null;
            }
            return (
              <div
                key={item.id}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color: !darkMode && !isMobileDrawer ? 'rgba(255,255,255,0.5)' : T.textMuted,
                  textTransform: 'uppercase',
                  padding: isMobileDrawer ? '16px 8px 6px' : '14px 8px 4px',
                }}
              >
                {item.label}
              </div>
            );
          }
          const isActive = activeNav === item.id;
          const isHovered = hovered === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavTo(item.id);
              }}
              onMouseEnter={(e) => {
                setHovered(item.id);
                if (showCollapsedTooltip && item.label) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    label: item.label,
                    top: rect.top + rect.height / 2,
                    left: rect.right + 10,
                  });
                }
              }}
              onMouseLeave={() => {
                setHovered(null);
                setTooltip(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                padding: '11px 10px',
                borderRadius: 9,
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                background: isActive
                  ? !darkMode && !isMobileDrawer
                    ? 'rgba(255,255,255,0.22)'
                    : T.indigoLight
                  : isHovered
                    ? !darkMode && !isMobileDrawer
                      ? 'rgba(255,255,255,0.1)'
                      : T.bgHover
                    : isCollapsed && !isMobileDrawer
                      ? sidebarBackground
                      : 'transparent',
                color: isActive
                  ? !darkMode && !isMobileDrawer
                    ? '#ffffff'
                    : T.indigo
                  : isHovered
                    ? !darkMode && !isMobileDrawer
                      ? 'rgba(255,255,255,0.9)'
                      : T.text
                    : !darkMode && !isMobileDrawer
                      ? 'rgba(255,255,255,0.65)'
                      : T.textSub,
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                marginBottom: 2,
                transition: 'background 0.15s, color 0.15s',
                flexDirection: isMobileDrawer ? 'row' : 'column',
                justifyContent: isMobileDrawer ? 'flex-start' : 'center',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  width: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon && <item.icon />}
              </span>
              {(isMobileDrawer || !isCollapsed) && (
                <span
                  style={{
                    flex: 1,
                    textAlign: isMobileDrawer ? 'left' : 'center',
                    fontSize: isMobileDrawer ? 13 : 12,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {tooltip && showCollapsedTooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translateY(-50%)',
            background: darkMode
              ? T.bgSidebar
              : 'linear-gradient(133deg, #0567bc, #1597b8) no-repeat fixed',
            color: darkMode ? T.text : '#ffffff',
            border: darkMode ? `1px solid ${T.border}` : 'none',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 10px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
