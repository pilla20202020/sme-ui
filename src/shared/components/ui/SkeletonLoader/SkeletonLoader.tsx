import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  /** Number of skeleton block groups to render */
  blocks?: number;
  /** Number of lines rendered below the title in each block */
  linesPerBlock?: number;
  /** Whether each block starts with a wider "title" line */
  showTitle?: boolean;
  className?: string;
}

export function SkeletonLoader({
  blocks = 4,
  linesPerBlock = 2,
  showTitle = true,
  className,
}: SkeletonLoaderProps) {
  return (
    <div className={`${styles.skeletonWrap} ${className ?? ''}`}>
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className={styles.skeletonBlock}>
          {showTitle && <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />}
          {Array.from({ length: linesPerBlock }, (_, j) => (
            <div
              key={j}
              className={`${styles.skeletonLine} ${
                j === linesPerBlock - 1 ? styles.skeletonShort : ''
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
