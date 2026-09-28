import styles from './Spinner.module.css';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

interface SpinnerProps {
  /** Diameter preset */
  size?: SpinnerSize;
  /** Overrides the spinning arc color (defaults to var(--color-indigo)) */
  color?: string;
  /** Overrides the track ring color (defaults to var(--color-border)) */
  trackColor?: string;
  /** Renders centered as an absolute overlay filling the nearest positioned ancestor */
  overlay?: boolean;
  /** Accessible label for screen readers. Omit (or set decorative) when adjacent visible text already announces the loading state. */
  label?: string;
  /** Hides the spinner from screen readers — use when sibling text (e.g. a button's "Saving…" label) already conveys the loading state */
  decorative?: boolean;
  className?: string;
}

export function Spinner({
  size = 'md',
  color,
  trackColor,
  overlay = false,
  label = 'Loading',
  decorative = false,
  className,
}: SpinnerProps) {
  const spinner = (
    <span
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={`${styles.spinner} ${styles[size]} ${className ?? ''}`}
      style={{
        borderColor: trackColor,
        borderTopColor: color,
      }}
    />
  );

  if (!overlay) return spinner;

  return <div className={styles.overlay}>{spinner}</div>;
}

export default Spinner;
