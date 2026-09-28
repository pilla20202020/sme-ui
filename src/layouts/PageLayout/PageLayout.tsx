import type { ReactNode } from 'react';
import { Sidebar } from '@/layouts/Sidebar';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  activeNav: string;
  onNavTo: (id: string) => void;
  children: ReactNode;
}

export function PageLayout({ activeNav, onNavTo, children }: PageLayoutProps) {
  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        <Sidebar activeNav={activeNav} onNavTo={onNavTo} />
      </div>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

export default PageLayout;



