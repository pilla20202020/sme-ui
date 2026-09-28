import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Card } from '@/shared/components/ui/Card';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchDailyCash } from '@/domains/pharmacy-dashboard/api/dashboardApi';
import styles from './ExpensesPage.module.css';

interface CashDetailPanelProps {
  tenantId: number;
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TileProps {
  label: string;
  value: string;
  accent: string;
  sub?: string;
}

function Tile({ label, value, accent, sub }: TileProps) {
  const { T } = useTheme();
  return (
    <Card style={{ borderLeft: `4px solid ${accent}`, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// STORY-055 (cash detail half) — GET /cash/daily generalized with a date
// picker instead of Sprint 7's hardcoded "today" (PRD §2/§4: the exact same
// endpoint/response shape, DailyCashResponse, reused from
// pharmacy-dashboard/api/dashboardApi.ts rather than duplicated). Gated on
// cash:read independently of expense:read/expense:create — a user can have
// this without either of the other two (e.g. the accountant persona).
export function CashDetailPanel({ tenantId }: CashDetailPanelProps) {
  const { T } = useTheme();
  const [date, setDate] = useState(todayYmd());

  const dailyCashQuery = useQuery({
    queryKey: ['expenses', 'cash-daily', tenantId, date],
    queryFn: ({ signal }) => fetchDailyCash(tenantId, date, signal),
    enabled: !!date,
  });

  const data = dailyCashQuery.data;

  return (
    <div>
      <div className={styles.filterBar}>
        <label className={styles.filterLabel} style={{ color: T.textMuted }}>
          Date
          <DatePicker value={date} onChange={setDate} />
        </label>
      </div>

      {!date ? (
        <div style={{ color: T.textMuted, fontSize: 14, marginTop: 16 }}>Select a date.</div>
      ) : dailyCashQuery.isLoading ? (
        <div style={{ marginTop: 16 }}>
          <Spinner size="sm" />
        </div>
      ) : dailyCashQuery.isError ? (
        <div style={{ color: T.red, marginTop: 16 }}>Couldn&apos;t load the cash detail.</div>
      ) : data ? (
        <div className={styles.cashGrid}>
          <Tile
            label="Sales Total"
            value={money(data.salesTotal)}
            accent={T.green}
            sub={`${data.saleCount} sale${data.saleCount === 1 ? '' : 's'}`}
          />
          <Tile
            label="Returns Total"
            value={money(data.returnsTotal)}
            accent={T.red}
            sub={`${data.returnCount} return${data.returnCount === 1 ? '' : 's'}`}
          />
          <Tile
            label="Expenses Total"
            value={money(data.expensesTotal)}
            accent={T.amber}
            sub={`${data.expenseCount} expense${data.expenseCount === 1 ? '' : 's'}`}
          />
          <Tile label="Net Cash Position" value={money(data.netCashPosition)} accent={T.indigo} />
        </div>
      ) : null}
    </div>
  );
}

export default CashDetailPanel;
