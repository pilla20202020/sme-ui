import { ReactNode } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';
import styles from './Topbar.module.css';

interface TopbarProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}

export function Topbar({ title, subtitle, extra }: TopbarProps) {
  const { darkMode, toggleDarkMode } = useTheme();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className={styles.topbar}>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      <div className={styles.date}>{today}</div>
      {extra}
      <button
        className={styles.themeToggle}
        onClick={toggleDarkMode}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀' : '☾'}
      </button>
    </div>
  );
}

export default Topbar;



