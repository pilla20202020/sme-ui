import { CSSProperties } from 'react';

interface ActionBtnProps {
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
  title?: string;
}

export function ActionBtn({ label, color, onClick, disabled, small, title }: ActionBtnProps) {
  const style: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: small ? '4px 10px' : '7px 16px',
    fontSize: small ? 11 : 13, fontWeight: 600,
    borderRadius: 8, border: 'none',
    background: disabled ? '#ccc' : color,
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };
  return (
    <button style={style} onClick={disabled ? undefined : onClick} title={title} disabled={disabled}>
      {label}
    </button>
  );
}



