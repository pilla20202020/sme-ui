import { useEffect, useRef, useState } from 'react';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import styles from './ReasonDropdown.module.css';

interface ReasonDropdownProps {
  id?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ReasonDropdown({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select a reason…',
  disabled = false,
}: ReasonDropdownProps) {
  const { T } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        id={id}
        type="button"
        className={styles.trigger}
        style={{ borderColor: T.border, color: T.text, background: T.bgAlt }}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.triggerLabel} style={{ color: value ? T.text : T.textMuted }}>
          {value || placeholder}
        </span>
        <HiOutlineChevronDown className={styles.chevron} data-open={open} />
      </button>

      {open && (
        <ul
          className={styles.list}
          role="listbox"
          style={{ background: T.bgCard, borderColor: T.border }}
        >
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={styles.option}
              title={opt}
              style={{
                color: T.text,
                background: opt === value ? T.indigoDim : 'transparent',
              }}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              <span className={styles.optionText}>{opt}</span>
              {opt === value && <HiOutlineCheck className={styles.checkIcon} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
