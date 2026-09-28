import { useState, useRef, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { MdChevronLeft, MdChevronRight, MdExpandMore } from 'react-icons/md';
import { useTheme } from '@/app/providers/ThemeContext';
import { usePipelineStats } from '../hooks/usePipelineStats';
import type { Timeframe } from '../api/dashboardApi';
import { PIPELINE_MIN_YEAR, PIPELINE_SERIES_COLORS } from '../constants';
import { Spinner } from '@/shared/components/ui/Spinner';
import styles from './EnrollmentVsRejectChart.module.css';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - PIPELINE_MIN_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i
);
const MAX_WEEK_OFFSET = -52;
const YEARLY_WINDOW = 5;
const YEARLY_MAX_START = Math.max(PIPELINE_MIN_YEAR, CURRENT_YEAR - YEARLY_WINDOW + 1);

function getWeekRange(offset: number): { label: string; startDate: string } {
  const now = new Date();
  const daysToMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;

  return { label: `${fmt(monday)} – ${fmt(sunday)}`, startDate: iso };
}

export function EnrollmentVsRejectChart() {
  const { T, darkMode } = useTheme();
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [yearlyStartYear, setYearlyStartYear] = useState(PIPELINE_MIN_YEAR);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!yearDropdownOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [yearDropdownOpen]);

  const week = timeframe === 'weekly' ? getWeekRange(weekOffset) : null;
  const year = timeframe === 'monthly' ? selectedYear : undefined;
  const { data, isLoading } = usePipelineStats(timeframe, year, week?.startDate);

  const yearlyWindow = Array.from({ length: YEARLY_WINDOW }, (_, i) => yearlyStartYear + i);
  const rawLabels = data?.labels ?? [];

  const labels = timeframe === 'yearly' ? yearlyWindow.map(String) : (data?.labels ?? []);

  const series =
    timeframe === 'yearly' && data?.series
      ? data.series.map((s) => ({
          ...s,
          data: yearlyWindow.map((y) => {
            const idx = rawLabels.indexOf(String(y));
            return idx >= 0 ? (s.data[idx] ?? 0) : 0;
          }),
        }))
      : (data?.series ?? []);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 400, dynamicAnimation: { enabled: true, speed: 300 } },
    },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: '30%',
        borderRadiusApplication: 'end',
      },
    },
    colors: PIPELINE_SERIES_COLORS,
    xaxis: {
      categories: labels,
      labels: { style: { colors: T.textMuted, fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: {
      borderColor: T.border,
      strokeDashArray: 3,
    },
    dataLabels: { enabled: false },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      labels: { colors: T.textSecondary },
      markers: { size: 6, shape: 'circle', strokeWidth: 0 },
      itemMargin: { horizontal: 8 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: { fontSize: '12px' },
      theme: darkMode ? 'dark' : 'light',
    },
  };

  return (
    <div
      className={styles.card}
      style={{
        background: T.bgCard,
        borderRadius: 14,
        boxShadow: T.shadow,
        border: '1px solid ' + T.border,
      }}
    >
      <div className={styles.header}>
        <div className={styles.title}>Pipeline Breakdown</div>

        <div className={styles.controls}>
          {/* Week navigator — visible only in Weekly mode */}
          <div className={styles.weekPicker} data-visible={timeframe === 'weekly'}>
            <button
              className={styles.weekNavBtn}
              onClick={() => setWeekOffset((o) => Math.max(MAX_WEEK_OFFSET, o - 1))}
              disabled={weekOffset <= MAX_WEEK_OFFSET}
              style={{ color: T.textMuted }}
            >
              <MdChevronLeft size={16} />
            </button>
            <span className={styles.weekLabel} style={{ color: T.text }}>
              {week?.label ?? ''}
            </span>
            <button
              className={styles.weekNavBtn}
              onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
              disabled={weekOffset >= 0}
              style={{ color: T.textMuted }}
            >
              <MdChevronRight size={16} />
            </button>
          </div>

          {/* Yearly range navigator — visible only in Yearly mode */}
          <div className={styles.weekPicker} data-visible={timeframe === 'yearly'}>
            <button
              className={styles.weekNavBtn}
              onClick={() => setYearlyStartYear((y) => Math.max(PIPELINE_MIN_YEAR, y - 1))}
              disabled={yearlyStartYear <= PIPELINE_MIN_YEAR}
              style={{ color: T.textMuted }}
            >
              <MdChevronLeft size={16} />
            </button>
            <span className={styles.weekLabel} style={{ color: T.text }}>
              {yearlyStartYear} – {yearlyStartYear + YEARLY_WINDOW - 1}
            </span>
            <button
              className={styles.weekNavBtn}
              onClick={() => setYearlyStartYear((y) => Math.min(YEARLY_MAX_START, y + 1))}
              disabled={yearlyStartYear >= YEARLY_MAX_START}
              style={{ color: T.textMuted }}
            >
              <MdChevronRight size={16} />
            </button>
          </div>

          {/* Year picker — visible only in Monthly mode */}
          <div
            ref={yearPickerRef}
            className={styles.yearPicker}
            data-visible={timeframe === 'monthly'}
          >
            <button
              className={styles.yearBtn}
              onClick={() => setSelectedYear((y) => Math.max(PIPELINE_MIN_YEAR, y - 1))}
              disabled={selectedYear <= PIPELINE_MIN_YEAR}
              style={{ color: T.textMuted }}
            >
              <MdChevronLeft size={16} />
            </button>

            <button
              className={styles.yearLabel}
              onClick={() => setYearDropdownOpen((o) => !o)}
              style={{ color: T.text }}
            >
              {selectedYear}
              <MdExpandMore
                size={14}
                style={{
                  marginLeft: 2,
                  transition: 'transform 0.18s ease',
                  transform: yearDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: T.textMuted,
                }}
              />
            </button>

            {yearDropdownOpen && (
              <div
                className={styles.yearDropdown}
                style={{
                  background: T.bgCard,
                  border: '1px solid ' + T.border,
                  boxShadow: T.shadow,
                }}
              >
                {YEAR_OPTIONS.map((y) => (
                  <button
                    key={y}
                    className={`${styles.yearOption} ${y === selectedYear ? styles.yearOptionActive : ''}`}
                    onClick={() => {
                      setSelectedYear(y);
                      setYearDropdownOpen(false);
                    }}
                    style={y === selectedYear ? { color: '#00ccff' } : { color: T.text }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            <button
              className={styles.yearBtn}
              onClick={() => setSelectedYear((y) => Math.min(CURRENT_YEAR, y + 1))}
              disabled={selectedYear >= CURRENT_YEAR}
              style={{ color: T.textMuted }}
            >
              <MdChevronRight size={16} />
            </button>
          </div>

          {/* Timeframe segmented control */}
          <div className={styles.filters}>
            <div
              className={styles.filterSlider}
              style={{
                transform: `translateX(${TIMEFRAMES.findIndex(({ value }) => value === timeframe) * 100}%)`,
              }}
            />
            {TIMEFRAMES.map(({ label, value }) => (
              <button
                key={value}
                className={`${styles.filterBtn} ${timeframe === value ? styles.filterBtnActive : ''}`}
                onClick={() => {
                  setTimeframe(value);
                  if (value === 'weekly') setWeekOffset(0);
                  if (value === 'yearly') setYearlyStartYear(PIPELINE_MIN_YEAR);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartWrap} data-loading={isLoading}>
        <Chart options={options} series={series} type="bar" height={240} />
        {isLoading && <Spinner overlay size="lg" />}
      </div>
    </div>
  );
}
