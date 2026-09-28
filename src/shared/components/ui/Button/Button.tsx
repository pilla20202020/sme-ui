import styles from './Button.module.css';

interface ButtonProps {
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
  title?: string;
}

export function Button({ label, color, onClick, disabled, small, title }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${small ? styles.small : styles.default}`}
      style={{ background: disabled ? '#ccc' : color }}
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default Button;



