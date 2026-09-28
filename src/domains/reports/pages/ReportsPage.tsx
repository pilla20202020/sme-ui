import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Spinner } from '@/shared/components/ui/Spinner';
import {
  fetchSalesReport,
  fetchStockReport,
  fetchPurchasesReport,
  type SaleReportEntry,
  type InventoryMovementReportEntry,
  type PurchaseOrderReportEntry,
} from '../api/reportsApi';
import styles from './ReportsPage.module.css';

type TabId = 'sales' | 'stock' | 'purchases';

interface TabDef {
  id: TabId;
  label: string;
  permission: string;
}

const ALL_TABS: TabDef[] = [
  { id: 'sales', label: 'Sales', permission: 'sales:read' },
  { id: 'stock', label: 'Stock', permission: 'inventory:read' },
  { id: 'purchases', label: 'Purchases', permission: 'purchasing:read' },
];

const salesColumns: ColumnDef<SaleReportEntry>[] = [
  { key: 'saleId', header: 'Sale #', render: (r) => `#${r.saleId}` },
  { key: 'saleDate', header: 'Date', render: (r) => r.saleDate ?? '—' },
  { key: 'customer', header: 'Customer', render: (r) => r.customer?.name ?? 'Walk-in' },
  { key: 'lines', header: 'Items', render: (r) => r.lines.length },
  { key: 'total', header: 'Total', render: (r) => r.total.toLocaleString() },
];

const stockColumns: ColumnDef<InventoryMovementReportEntry>[] = [
  { key: 'occurredAt', header: 'Date', render: (r) => r.occurredAt ?? '—' },
  { key: 'productId', header: 'Product ID', render: (r) => r.productId },
  { key: 'movementType', header: 'Type', render: (r) => r.movementType },
  { key: 'quantityDelta', header: 'Qty Δ', render: (r) => r.quantityDelta },
  { key: 'reason', header: 'Reason', render: (r) => r.reason ?? '—' },
];

const purchaseColumns: ColumnDef<PurchaseOrderReportEntry>[] = [
  { key: 'purchaseOrderId', header: 'PO #', render: (r) => `#${r.purchaseOrderId}` },
  { key: 'orderDate', header: 'Order Date', render: (r) => r.orderDate ?? '—' },
  { key: 'supplierId', header: 'Supplier ID', render: (r) => r.supplierId },
  { key: 'status', header: 'Status', render: (r) => r.status },
  { key: 'lines', header: 'Lines', render: (r) => r.lines.length },
];

interface DateRangeState {
  dateFrom: string;
  dateTo: string;
}

function defaultRange(): DateRangeState {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const toYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { dateFrom: toYmd(start), dateTo: toYmd(today) };
}

interface DateRangeBarProps {
  range: DateRangeState;
  onChange: (range: DateRangeState) => void;
}

function DateRangeBar({ range, onChange }: DateRangeBarProps) {
  return (
    <div className={styles.filterBar}>
      <label className={styles.filterLabel}>
        From
        <DatePicker value={range.dateFrom} onChange={(v) => onChange({ ...range, dateFrom: v })} />
      </label>
      <label className={styles.filterLabel}>
        To
        <DatePicker value={range.dateTo} onChange={(v) => onChange({ ...range, dateTo: v })} />
      </label>
    </div>
  );
}

export function ReportsPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => hasPermission(t.permission)),
    [hasPermission]
  );

  const [activeTab, setActiveTab] = useState<TabId | null>(visibleTabs[0]?.id ?? null);
  const currentTab = visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0] ?? null;

  const [salesRange, setSalesRange] = useState<DateRangeState>(defaultRange);
  const [stockRange, setStockRange] = useState<DateRangeState>(defaultRange);
  const [purchasesRange, setPurchasesRange] = useState<DateRangeState>(defaultRange);

  const salesQuery = useQuery({
    queryKey: ['reports', 'sales', tenantId, salesRange],
    queryFn: ({ signal }) => fetchSalesReport(tenantId as number, salesRange, signal),
    enabled: currentTab?.id === 'sales' && tenantId != null,
  });

  const stockQuery = useQuery({
    queryKey: ['reports', 'stock', tenantId, stockRange],
    queryFn: ({ signal }) => fetchStockReport(tenantId as number, stockRange, signal),
    enabled: currentTab?.id === 'stock' && tenantId != null,
  });

  const purchasesQuery = useQuery({
    queryKey: ['reports', 'purchases', tenantId, purchasesRange],
    queryFn: ({ signal }) => fetchPurchasesReport(tenantId as number, purchasesRange, signal),
    enabled: currentTab?.id === 'purchases' && tenantId != null,
  });

  if (visibleTabs.length === 0) {
    return (
      <div>
        <Topbar title="Reports" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view any reports.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Reports" subtitle={tenantName ?? undefined} />

      <div className={styles.tabBar}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={styles.tabButton}
            style={{
              color: currentTab?.id === tab.id ? T.indigo : T.textMuted,
              borderBottom: `2px solid ${currentTab?.id === tab.id ? T.indigo : 'transparent'}`,
              fontWeight: currentTab?.id === tab.id ? 700 : 500,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {currentTab?.id === 'sales' && (
          <>
            <DateRangeBar range={salesRange} onChange={setSalesRange} />
            {salesQuery.isLoading ? (
              <Spinner size="sm" />
            ) : salesQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load the sales report.</div>
            ) : (
              <DataTable
                data={salesQuery.data ?? []}
                columns={salesColumns}
                getRowKey={(r) => r.saleId}
                emptyMessage="No sales in this date range."
              />
            )}
          </>
        )}

        {currentTab?.id === 'stock' && (
          <>
            <DateRangeBar range={stockRange} onChange={setStockRange} />
            {stockQuery.isLoading ? (
              <Spinner size="sm" />
            ) : stockQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load the stock report.</div>
            ) : (
              <DataTable
                data={stockQuery.data ?? []}
                columns={stockColumns}
                getRowKey={(r) => r.movementId}
                emptyMessage="No stock movements in this date range."
              />
            )}
          </>
        )}

        {currentTab?.id === 'purchases' && (
          <>
            <DateRangeBar range={purchasesRange} onChange={setPurchasesRange} />
            {purchasesQuery.isLoading ? (
              <Spinner size="sm" />
            ) : purchasesQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load the purchases report.</div>
            ) : (
              <DataTable
                data={purchasesQuery.data ?? []}
                columns={purchaseColumns}
                getRowKey={(r) => r.purchaseOrderId}
                emptyMessage="No purchase orders in this date range."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
