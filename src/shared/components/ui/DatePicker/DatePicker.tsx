import { useEffect, useRef, useState } from 'react';
import { HiOutlineCalendar, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import styles from './DatePicker.module.css';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplay(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function DatePicker({ value, onChange, placeholder = 'Select date', minDate }: DatePickerProps) {
  const { T } = useTheme();
  const today = new Date();
  const ref = useRef<HTMLDivElement>(null);

  const initDate = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [open, setOpen] = useState(false);

  /* keep view in sync when value changes externally */
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const chosen = new Date(viewYear, viewMonth, day);
    const ymd = toYMD(chosen);
    onChange(ymd);
    setOpen(false);
  }

  /* build calendar grid */
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayYmd = toYMD(today);
  const minYmd = minDate ?? '';

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  /* pad to full grid */
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        style={{
          border: `1px solid ${open ? T.indigo : T.border}`,
          background: T.bg,
          color: value ? T.text : T.textMuted,
          boxShadow: open ? `0 0 0 3px ${T.indigoDim}` : 'none',
        }}
      >
        <HiOutlineCalendar size={16} style={{ color: T.indigo, flexShrink: 0 }} />
        <span>{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {open && (
        <div
          className={styles.popover}
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: `0 8px 32px rgba(0,0,0,0.14)` }}
        >
          {/* Month nav */}
          <div className={styles.nav}>
            <button type="button" className={styles.navBtn} onClick={prevMonth}
              style={{ background: T.bgAlt, color: T.text, border: `1px solid ${T.border}` }}>
              <HiOutlineChevronLeft size={14} />
            </button>
            <span className={styles.monthLabel} style={{ color: T.text }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className={styles.navBtn} onClick={nextMonth}
              style={{ background: T.bgAlt, color: T.text, border: `1px solid ${T.border}` }}>
              <HiOutlineChevronRight size={14} />
            </button>
          </div>

          {/* Day of week headers */}
          <div className={styles.grid}>
            {DAYS.map(d => (
              <div key={d} className={styles.dayHeader} style={{ color: T.textMuted }}>{d}</div>
            ))}

            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = ymd === value;
              const isToday = ymd === todayYmd;
              const isDisabled = minYmd ? ymd < minYmd : false;
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={styles.day}
                  style={{
                    background: isSelected ? T.indigo : isToday ? T.indigoDim : 'transparent',
                    color: isSelected ? '#fff' : isDisabled ? T.textMuted : isToday ? T.indigo : T.text,
                    border: isToday && !isSelected ? `1px solid ${T.indigo}` : '1px solid transparent',
                    opacity: isDisabled ? 0.4 : 1,
                    fontWeight: isSelected || isToday ? 700 : 400,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer quick actions */}
          <div className={styles.footer} style={{ borderTop: `1px solid ${T.border}` }}>
            <button type="button" className={styles.todayBtn}
              style={{ color: T.indigo }}
              onClick={() => { onChange(todayYmd); setOpen(false); }}>
              Today
            </button>
            <button type="button" className={styles.clearBtn}
              style={{ color: T.textMuted }}
              onClick={() => { onChange(''); setOpen(false); }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;



