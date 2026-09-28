import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchProducts, type Product } from '@/domains/catalog/api/catalogApi';
import { fetchStaff, type StaffMember } from '@/domains/staff/api/staffApi';
import { daysUntil, expiryDisplayStyle } from '@/domains/catalog/pages/ProductBatchesModal';
import {
  fetchMovements,
  fetchOnHand,
  fetchLowStockAlerts,
  fetchNearExpiryAlerts,
  type InventoryMovement,
  type InventoryMovementType,
  type LowStockAlertEntry,
  type NearExpiryAlertEntry,
  type OnHandBatchEntry,
} from '../api/inventoryApi';
import { AdjustStockModal } from './AdjustStockModal';
import styles from './InventoryPage.module.css';

type TabId = 'movements' | 'low-stock' | 'near-expiry';

const TABS: { id: TabId; label: string }[] = [
  { id: 'movements', label: 'Movements' },
  { id: 'low-stock', label: 'Low Stock' },
  { id: 'near-expiry', label: 'Near Expiry' },
];

const MOVEMENT_TYPE_FILTERS: { value: InventoryMovementType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'sale', label: 'Sale' },
  { value: 'return', label: 'Return' },
];

function movementTypeLabel(type: InventoryMovementType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function signedDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

interface DateRangeState {
  dateFrom: string;
  dateTo: string;
}

// STORY-049/STORY-050/STORY-051 — Inventory Management UI (EPIC-005 UI). One
// domain, three read screens (movements ledger + on-hand, low-stock alerts,
// near-expiry alerts) plus the manual adjustment form reached from here —
// all gated on `inventory:read` for viewing; the "Adjust Stock" action is
// gated separately (and more strictly) on `inventory:adjust` (PRD §2).
export function InventoryPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const canRead = hasPermission('inventory:read');
  // GOTCHA (PRD §2/STORY-050): `inventory:adjust` is a STRICTER, separate
  // permission from `inventory:read` — per Sprint 4 seed grants,
  // inventory_staff/manager/owner have both, accountant/cashier have
  // neither. The adjustment button below is omitted, not disabled, for a
  // user without it.
  const canAdjust = hasPermission('inventory:adjust');
  // Staff names are only used to render a friendlier "actor" column on the
  // ledger — this is a nice-to-have, not the primary read this screen is
  // gated on, so it's fetched only when the viewer also holds `user:read`
  // (inventory_staff may not) and falls back to "User #<id>" otherwise,
  // never a failed/blocked page (PRD §2 permission-gating pattern).
  const canReadStaff = hasPermission('user:read');

  const [activeTab, setActiveTab] = useState<TabId>('movements');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustInitialProductId, setAdjustInitialProductId] = useState<number | undefined>(
    undefined
  );

  // ── Movements tab state ─────────────────────────────────────────────────
  const [productFilter, setProductFilter] = useState<number | ''>('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<InventoryMovementType | ''>('');
  const [movementsRange, setMovementsRange] = useState<DateRangeState>({
    dateFrom: '',
    dateTo: '',
  });

  // ── Near-expiry tab state ───────────────────────────────────────────────
  const [withinDays, setWithinDays] = useState(30);

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', tenantId, 'all-active'],
    queryFn: ({ signal }) => fetchProducts(tenantId as number, { per_page: 100 }, signal),
    enabled: tenantId != null && canRead,
  });

  const activeProducts: Product[] = useMemo(
    () => (productsQuery.data?.data ?? []).filter((p) => p.isActive),
    [productsQuery.data]
  );

  const productNameById = useMemo(() => {
    const map = new Map<number, string>();
    (productsQuery.data?.data ?? []).forEach((p) => map.set(p.productId, p.name));
    return map;
  }, [productsQuery.data]);

  const staffQuery = useQuery({
    queryKey: ['staff', tenantId],
    queryFn: ({ signal }) => fetchStaff(tenantId as number, signal),
    enabled: tenantId != null && canRead && canReadStaff,
  });

  const actorNameById = useMemo(() => {
    const map = new Map<number, string>();
    (staffQuery.data?.data ?? []).forEach((u: StaffMember) =>
      map.set(u.userId, `${u.firstName} ${u.lastName}`.trim())
    );
    return map;
  }, [staffQuery.data]);

  const movementsQuery = useQuery({
    queryKey: [
      'inventory',
      'movements',
      tenantId,
      productFilter,
      movementTypeFilter,
      movementsRange,
    ],
    queryFn: ({ signal }) =>
      fetchMovements(
        tenantId as number,
        {
          productId: productFilter || undefined,
          movementType: movementTypeFilter || undefined,
          dateFrom: movementsRange.dateFrom || undefined,
          dateTo: movementsRange.dateTo || undefined,
          per_page: 100,
        },
        signal
      ),
    enabled: tenantId != null && canRead && activeTab === 'movements',
  });

  const onHandQuery = useQuery({
    queryKey: ['inventory', 'on-hand', tenantId, productFilter],
    queryFn: ({ signal }) => fetchOnHand(tenantId as number, productFilter as number, signal),
    enabled: tenantId != null && canRead && activeTab === 'movements' && productFilter !== '',
  });

  const lowStockQuery = useQuery({
    queryKey: ['inventory', 'alerts', 'low-stock', tenantId],
    queryFn: ({ signal }) => fetchLowStockAlerts(tenantId as number, { per_page: 100 }, signal),
    enabled: tenantId != null && canRead && activeTab === 'low-stock',
  });

  const nearExpiryQuery = useQuery({
    queryKey: ['inventory', 'alerts', 'near-expiry', tenantId, withinDays],
    queryFn: ({ signal }) =>
      fetchNearExpiryAlerts(tenantId as number, withinDays, { per_page: 100 }, signal),
    enabled: tenantId != null && canRead && activeTab === 'near-expiry',
  });

  const movementColumns: ColumnDef<InventoryMovement>[] = useMemo(
    () => [
      {
        key: 'occurredAt',
        header: 'Date',
        render: (r) => (r.occurredAt ? new Date(r.occurredAt).toLocaleString() : '—'),
      },
      {
        key: 'product',
        header: 'Product',
        render: (r) => productNameById.get(r.productId) ?? `Product #${r.productId}`,
      },
      {
        key: 'movementType',
        header: 'Type',
        render: (r) => movementTypeLabel(r.movementType),
      },
      {
        key: 'quantityDelta',
        header: 'Qty Δ',
        render: (r) => (
          <span style={{ color: r.quantityDelta > 0 ? T.green : T.red, fontWeight: 700 }}>
            {signedDelta(r.quantityDelta)}
          </span>
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (r) => r.reason ?? '—',
      },
      {
        key: 'actor',
        header: 'Actor',
        render: (r) =>
          r.actorId == null ? '—' : (actorNameById.get(r.actorId) ?? `User #${r.actorId}`),
      },
    ],
    [T, productNameById, actorNameById]
  );

  const lowStockColumns: ColumnDef<LowStockAlertEntry>[] = useMemo(
    () => [
      { key: 'name', header: 'Product', render: (r) => r.name },
      { key: 'sku', header: 'SKU', render: (r) => r.sku ?? '—' },
      { key: 'reorderThreshold', header: 'Reorder Threshold', render: (r) => r.reorderThreshold },
      { key: 'totalOnHand', header: 'Total On Hand', render: (r) => r.totalOnHand },
      {
        key: 'shortage',
        header: 'Shortage',
        render: (r) => (
          <span style={{ color: T.red, fontWeight: 700 }}>
            {Math.max(0, r.reorderThreshold - r.totalOnHand)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (r) =>
          canAdjust && (
            <button
              type="button"
              onClick={() => {
                setAdjustInitialProductId(r.productId);
                setShowAdjust(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: T.indigo,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Adjust
            </button>
          ),
      },
    ],
    [T, canAdjust]
  );

  const nearExpiryColumns: ColumnDef<NearExpiryAlertEntry>[] = useMemo(
    () => [
      { key: 'productName', header: 'Product', render: (r) => r.productName },
      { key: 'batchNumber', header: 'Batch #', render: (r) => r.batchNumber },
      {
        key: 'expiryDate',
        header: 'Expiry Date',
        render: (r) => {
          const style = expiryDisplayStyle(r.daysUntilExpiry, T);
          return (
            <span style={{ color: style.color, fontWeight: style.fontWeight }}>
              {r.expiryDate ?? '—'}
            </span>
          );
        },
      },
      { key: 'quantityRemaining', header: 'Qty Remaining', render: (r) => r.quantityRemaining },
      {
        key: 'daysUntilExpiry',
        header: 'Days Until Expiry',
        render: (r) => {
          const style = expiryDisplayStyle(r.daysUntilExpiry, T);
          return (
            <span style={{ color: style.color, fontWeight: style.fontWeight }}>
              {r.daysUntilExpiry < 0
                ? `Expired ${Math.abs(r.daysUntilExpiry)}d ago`
                : r.daysUntilExpiry}
            </span>
          );
        },
      },
    ],
    [T]
  );

  const onHandBatchColumns: ColumnDef<OnHandBatchEntry>[] = useMemo(
    () => [
      { key: 'batchNumber', header: 'Batch #', render: (r) => r.batchNumber },
      {
        key: 'expiryDate',
        header: 'Expiry Date',
        render: (r) => {
          const style = expiryDisplayStyle(daysUntil(r.expiryDate), T);
          return (
            <span style={{ color: style.color, fontWeight: style.fontWeight }}>
              {r.expiryDate ?? '—'}
            </span>
          );
        },
      },
      { key: 'quantityRemaining', header: 'Qty Remaining', render: (r) => r.quantityRemaining },
    ],
    [T]
  );

  if (!canRead) {
    return (
      <div>
        <Topbar title="Inventory" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view inventory.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Inventory" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div />
        {canAdjust && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => {
              setAdjustInitialProductId(undefined);
              setShowAdjust(true);
            }}
          >
            + Adjust Stock
          </button>
        )}
      </div>

      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={styles.tabButton}
            style={{
              color: activeTab === tab.id ? T.indigo : T.textMuted,
              borderBottom: `2px solid ${activeTab === tab.id ? T.indigo : 'transparent'}`,
              fontWeight: activeTab === tab.id ? 700 : 500,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'movements' && (
          <>
            <div className={styles.filterBar}>
              <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                Product
                <select
                  value={productFilter}
                  onChange={(e) =>
                    setProductFilter(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={styles.filterSelect}
                  style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
                >
                  <option value="">All products</option>
                  {activeProducts.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                Movement Type
                <select
                  value={movementTypeFilter}
                  onChange={(e) =>
                    setMovementTypeFilter(e.target.value as InventoryMovementType | '')
                  }
                  className={styles.filterSelect}
                  style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
                >
                  {MOVEMENT_TYPE_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                From
                <DatePicker
                  value={movementsRange.dateFrom}
                  onChange={(v) => setMovementsRange((r) => ({ ...r, dateFrom: v }))}
                />
              </label>
              <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                To
                <DatePicker
                  value={movementsRange.dateTo}
                  onChange={(v) => setMovementsRange((r) => ({ ...r, dateTo: v }))}
                />
              </label>
            </div>

            {productFilter !== '' && (
              <div
                className={styles.onHandCard}
                style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
              >
                {onHandQuery.isLoading ? (
                  <Spinner size="sm" />
                ) : onHandQuery.isError ? (
                  <div style={{ color: T.red }}>Couldn&apos;t load on-hand quantity.</div>
                ) : (
                  <>
                    <div className={styles.onHandTotal} style={{ color: T.text }}>
                      Total On Hand: {onHandQuery.data?.totalOnHand ?? 0}
                    </div>
                    <DataTable
                      data={onHandQuery.data?.batches ?? []}
                      columns={onHandBatchColumns}
                      getRowKey={(r) => r.batchId}
                      emptyMessage="No batches on hand for this product."
                    />
                  </>
                )}
              </div>
            )}

            {movementsQuery.isLoading ? (
              <Spinner size="sm" />
            ) : movementsQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load inventory movements.</div>
            ) : (
              <DataTable
                data={movementsQuery.data?.data ?? []}
                columns={movementColumns}
                getRowKey={(r) => r.movementId}
                emptyMessage="No inventory movements found."
              />
            )}
          </>
        )}

        {activeTab === 'low-stock' && (
          <>
            {lowStockQuery.isLoading ? (
              <Spinner size="sm" />
            ) : lowStockQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load low-stock alerts.</div>
            ) : (
              <DataTable
                data={lowStockQuery.data?.data ?? []}
                columns={lowStockColumns}
                getRowKey={(r) => r.productId}
                emptyMessage="No products are below their reorder threshold."
              />
            )}
          </>
        )}

        {activeTab === 'near-expiry' && (
          <>
            <div className={styles.filterBar}>
              <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                Within (days)
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={withinDays}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWithinDays(Number.isFinite(v) && v > 0 ? v : 30);
                  }}
                  className={styles.filterNumber}
                  style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
                />
              </label>
            </div>

            {nearExpiryQuery.isLoading ? (
              <Spinner size="sm" />
            ) : nearExpiryQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load near-expiry alerts.</div>
            ) : (
              <DataTable
                data={nearExpiryQuery.data?.data ?? []}
                columns={nearExpiryColumns}
                getRowKey={(r) => r.batchId}
                emptyMessage="No batches are nearing expiry in this window."
              />
            )}
          </>
        )}
      </div>

      {showAdjust && tenantId != null && (
        <AdjustStockModal
          tenantId={tenantId}
          initialProductId={adjustInitialProductId}
          onClose={() => setShowAdjust(false)}
        />
      )}
    </div>
  );
}

export default InventoryPage;
