import styles from './SectionDivider.module.css';

interface SectionDividerProps {
  label: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className={styles.divider}>
      <div className={styles.line} />
      <span className={styles.label}>{label}</span>
      <div className={styles.line} />
    </div>
  );
}

export default SectionDivider;



