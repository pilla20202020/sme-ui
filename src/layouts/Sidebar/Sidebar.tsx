import { NAV_ITEMS } from '@/shared/constants';
import logo from '@/assets/image/loogo.svg';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeNav: string;
  onNavTo: (id: string) => void;
}

export function Sidebar({ activeNav, onNavTo }: SidebarProps) {

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoWrapper}>
        <img src={logo} alt="Logo" />
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          if (item.separator) {
            return (
              <div key={item.id} className={styles.separator}>
                {item.label}
              </div>
            );
          }

          const isActive = activeNav === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
              onClick={() => onNavTo(item.id)}

            >
              <span className={styles.navIcon}>
                {Icon && <Icon />}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge !== undefined && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userAvatar}>UW</div>
      </div>
    </div>
  );
}

export default Sidebar;



