import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchSuppliers, type Supplier } from '@/domains/suppliers/api/suppliersApi';
import {
  fetchPurchaseOrders,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../api/purchasingApi';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { ROUTES } from '@/app/router/routeConfig';
import styles from './PurchaseOrdersListPage.module.css';

const STATUS_FILTERS: { value: PurchaseOrderStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
];

function statusColors(status: PurchaseOrderStatus, T: ReturnType<typeof useTheme>['T']) {
  if (status === 'received') return { fg: T.green, bg: T.greenLight };
  if (status === 'partially_received') return { fg: T.blue, bg: T.blueLight };
  return { fg: T.amber, bg: T.amberLight };
}

function statusLabel(status: PurchaseOrderStatus): string {
  if (status === 'partially_received') return 'Partially Received';
  if (status === 'received') return 'Received';
  return 'Pending';
}

// STORY-047 — Purchase order creation & list screen. Status is ALWAYS
// server-computed (PRD §2) — this page only ever displays it (as a badge),
// never as an editable control (no status dropdown anywhere in this UI).
export function PurchaseOrdersListPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('purchasing:create');
  const canRead = hasPermission('purchasing:read');

  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchasing', 'list', tenantId, statusFilter],
    queryFn: ({ signal }) =>
      fetchPurchaseOrders(
        tenantId as number,
        { status: statusFilter || undefined, per_page: 100 },
        signal
      ),
    enabled: tenantId != null && canRead,
  });

  // Purchase orders only carry supplierId (PRD interface) — fetch suppliers
  // once and map to names client-side rather than duplicating a supplier
  // fetch per row, reusing suppliers domain's fetchSuppliers directly
  // (PRD §2/§4: do not duplicate this fetch function).
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: ({ signal }) => fetchSuppliers(tenantId as number, signal),
    enabled: tenantId != null && canRead,
  });

  const supplierById = useMemo(() => {
    const map = new Map<number, Supplier>();
    (suppliersQuery.data?.data ?? []).forEach((s) => map.set(s.supplierId, s));
    return map;
  }, [suppliersQuery.data]);

  const columns: ColumnDef<PurchaseOrder>[] = useMemo(
    () => [
      {
        key: 'purchaseOrderId',
        header: 'PO #',
        render: (r) => `PO-${r.purchaseOrderId}`,
      },
      {
        key: 'supplier',
        header: 'Supplier',
        render: (r) => supplierById.get(r.supplierId)?.name ?? `Supplier #${r.supplierId}`,
      },
      {
        key: 'orderDate',
        header: 'Order Date',
        render: (r) => (r.orderDate ? new Date(r.orderDate).toLocaleDateString() : '—'),
      },
      {
        key: 'expectedDeliveryDate',
        header: 'Expected Delivery',
        render: (r) =>
          r.expectedDeliveryDate ? new Date(r.expectedDeliveryDate).toLocaleDateString() : '—',
      },
      {
        key: 'lines',
        header: 'Lines',
        render: (r) => r.lines.length,
      },
      {
        key: 'totalValue',
        header: 'Total Value',
        render: (r) =>
          r.lines
            .reduce((sum, l) => sum + l.quantityOrdered * l.unitCost, 0)
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => {
          const c = statusColors(r.status, T);
          return (
            <span
              style={{
                color: c.fg,
                background: c.bg,
                fontWeight: 600,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 999,
              }}
            >
              {statusLabel(r.status)}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <button
            type="button"
            className={styles.rowActionBtn}
            style={{ color: T.indigo }}
            onClick={() =>
              navigate(
                ROUTES.PURCHASE_ORDER_DETAIL.replace(':purchaseOrderId', String(r.purchaseOrderId))
              )
            }
          >
            View
          </button>
        ),
      },
    ],
    [T, supplierById, navigate]
  );

  if (!canRead) {
    return (
      <div>
        <Topbar title="Purchase Orders" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view purchase orders.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Purchase Orders" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | '')}
            className={styles.statusSelect}
            style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setShowCreate(true)}
          >
            + Create Purchase Order
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {purchaseOrdersQuery.isLoading ? (
          <Spinner size="sm" />
        ) : purchaseOrdersQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load purchase orders.</div>
        ) : (
          <DataTable
            data={purchaseOrdersQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.purchaseOrderId}
            emptyMessage="No purchase orders found."
          />
        )}
      </div>

      {showCreate && tenantId != null && (
        <PurchaseOrderFormModal
          tenantId={tenantId}
          onClose={() => setShowCreate(false)}
          onCreated={(po) => {
            setShowCreate(false);
            navigate(
              ROUTES.PURCHASE_ORDER_DETAIL.replace(':purchaseOrderId', String(po.purchaseOrderId))
            );
          }}
        />
      )}
    </div>
  );
}

export default PurchaseOrdersListPage;
