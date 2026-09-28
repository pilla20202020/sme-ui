import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdAccountBalanceWallet, MdAttachMoney, MdWarning } from 'react-icons/md';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { KpiCard } from '@/domains/dashboard/components/KpiCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchDailyCash, fetchLowStockCount } from '../api/dashboardApi';
import styles from './PharmacyDashboardPage.module.css';

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface TileShellProps {
  isLoading: boolean;
  isError: boolean;
  children: ReactNode;
}

/**
 * Wraps a single KPI tile's loading/error state — each tile fetches
 * independently (PRD §4: "one tile's failure must not blank out the
 * others"), so this never affects sibling tiles.
 */
function TileShell({ isLoading, isError, children }: TileShellProps) {
  const { T } = useTheme();

  if (isLoading) {
    return (
      <div
        className={styles.tilePlaceholder}
        style={{ background: T.bgCard, borderRadius: 14, border: '1px solid ' + T.border }}
      >
        <Spinner size="sm" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={styles.tilePlaceholder}
        style={{
          background: T.bgCard,
          borderRadius: 14,
          border: '1px solid ' + T.border,
          color: T.red,
        }}
      >
        Couldn&apos;t load this tile.
      </div>
    );
  }

  return <>{children}</>;
}

export function PharmacyDashboardPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();
  const date = todayYmd();

  const canReadCash = hasPermission('cash:read');
  const canReadInventory = hasPermission('inventory:read');

  const dailyCashQuery = useQuery({
    queryKey: ['pharmacy-dashboard', 'cash-daily', tenantId, date],
    queryFn: ({ signal }) => fetchDailyCash(tenantId as number, date, signal),
    enabled: canReadCash && tenantId != null,
  });

  const lowStockQuery = useQuery({
    queryKey: ['pharmacy-dashboard', 'low-stock-count', tenantId],
    queryFn: ({ signal }) => fetchLowStockCount(tenantId as number, signal),
    enabled: canReadInventory && tenantId != null,
  });

  const noTilesVisible = !canReadCash && !canReadInventory;

  return (
    <div>
      <Topbar title="Dashboard" subtitle={tenantName ?? undefined} />

      <div className={styles.kpiGrid}>
        {canReadCash && (
          <TileShell isLoading={dailyCashQuery.isLoading} isError={dailyCashQuery.isError}>
            <KpiCard
              label="Today's Sales"
              value={dailyCashQuery.data?.salesTotal ?? 0}
              dotColor={T.green}
              icon={MdAttachMoney}
            />
          </TileShell>
        )}

        {canReadInventory && (
          <TileShell isLoading={lowStockQuery.isLoading} isError={lowStockQuery.isError}>
            <KpiCard
              label="Low Stock Items"
              value={lowStockQuery.data ?? 0}
              dotColor={T.amber}
              icon={MdWarning}
            />
          </TileShell>
        )}

        {canReadCash && (
          <TileShell isLoading={dailyCashQuery.isLoading} isError={dailyCashQuery.isError}>
            <KpiCard
              label="Net Cash Position"
              value={dailyCashQuery.data?.netCashPosition ?? 0}
              dotColor={T.indigo}
              icon={MdAccountBalanceWallet}
            />
          </TileShell>
        )}

        {noTilesVisible && (
          <div style={{ color: T.textMuted, fontSize: 14 }}>
            You don&apos;t have permission to view any dashboard tiles.
          </div>
        )}
      </div>
    </div>
  );
}

export default PharmacyDashboardPage;
