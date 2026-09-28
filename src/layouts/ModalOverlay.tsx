import { ReactNode, useEffect } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';

interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
  width?: number | string;
}

export function ModalOverlay({ children, onClose, width = 540 }: ModalOverlayProps) {
  const { T } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bgCard, borderRadius: 16, width,
          boxShadow: T.shadowLg, border: '1px solid ' + T.border,
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'slideIn 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}



