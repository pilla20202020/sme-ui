import { useState, type ReactNode } from 'react';
import type { NavItem } from '@/shared/types/nav';
import { Sidebar } from './Sidebar';
import { LayoutShellProvider } from './LayoutShellContext';
import './PageLayout.css';

interface PageLayoutProps {
  /** Currently active nav item id — forwarded to Sidebar */
  activeNav: string;
  /** Called when the user clicks a nav item */
  onNavTo: (id: string) => void;
  /**
   * Nav items to render — defaults to the full static NAV_ITEMS list inside
   * Sidebar when omitted. Callers pass a filtered list to omit an item
   * entirely for a user lacking the permission it requires (Sprint 9,
   * STORY-040: `sales:create` gates the Point of Sale entry) — never render
   * it disabled, per this project's permission-gating convention.
   */
  navItems?: NavItem[];
  /** Authenticated user display name */
  userName?: string;
  /** Authenticated user email */
  userEmail?: string;
  /** Trigger logout flow */
  onLogout?: () => void;
  /** Page content rendered in the scrollable main area */
  children: ReactNode;
}

/**
 * Reusable two-column app shell:
 *   - Fixed 200 px Sidebar on the left
 *   - Scrollable main area taking the remaining width
 */
export function PageLayout({
  activeNav,
  onNavTo,
  navItems,
  userName,
  userEmail,
  onLogout,
  children,
}: PageLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function handleNavTo(id: string) {
    onNavTo(id);
    setMobileSidebarOpen(false);
  }

  return (
    <LayoutShellProvider
      value={{
        openSidebar: () => setMobileSidebarOpen(true),
        closeSidebar: () => setMobileSidebarOpen(false),
      }}
    >
      <div className="page-layout-root">
        <div
          className={`page-layout-sidebar ${sidebarCollapsed ? 'page-layout-sidebar-collapsed' : ''}`}
        >
          <Sidebar
            activeNav={activeNav}
            onNavTo={handleNavTo}
            navItems={navItems}
            isMobileDrawer={false}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            userName={userName}
            userEmail={userEmail}
            onLogout={onLogout}
          />
        </div>

        <div
          className={`page-layout-backdrop ${mobileSidebarOpen ? 'page-layout-backdrop-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden={!mobileSidebarOpen}
        />

        <div
          className={`page-layout-sidebar-mobile ${mobileSidebarOpen ? 'page-layout-sidebar-mobile-open' : ''}`}
        >
          <Sidebar
            activeNav={activeNav}
            onNavTo={handleNavTo}
            navItems={navItems}
            isMobileDrawer
            userName={userName}
            userEmail={userEmail}
            onLogout={onLogout}
          />
        </div>

        <main
          className={`page-layout-main ${sidebarCollapsed ? 'page-layout-main-collapsed' : ''}`}
        >
          {children}
        </main>
      </div>
    </LayoutShellProvider>
  );
}
