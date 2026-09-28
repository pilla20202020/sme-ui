import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, onClick, className, style }: CardProps) {
  return (
    <div
      className={`${styles.card} ${className ?? ''}`}
      data-clickable={!!onClick}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export default Card;



