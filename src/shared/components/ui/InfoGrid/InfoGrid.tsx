import styles from './InfoGrid.module.css';

interface InfoGridItem {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}

interface InfoGridProps {
  items: InfoGridItem[];
}

export function InfoGrid({ items }: InfoGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <div key={i}>
          <div className={styles.label}>{item.label}</div>
          <div className={`${styles.value} ${item.mono ? styles.mono : ''}`}>
            {item.value ?? '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

export default InfoGrid;



