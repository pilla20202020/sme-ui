import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchSuppliers } from '@/domains/suppliers/api/suppliersApi';
import { fetchProducts } from '@/domains/catalog/api/catalogApi';
import {
  fetchPurchaseOrder,
  fetchStockReceipts,
  type PurchaseOrderLine,
  type PurchaseOrderStatus,
  type StockReceipt,
} from '../api/purchasingApi';
import { ReceiveStockModal } from './ReceiveStockModal';
import { ROUTES } from '@/app/router/routeConfig';
import styles from './PurchaseOrderDetailPage.module.css';

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

// STORY-047/STORY-048 — PO detail view: shows the full PO with its lines
// (quantityOrdered vs quantityReceived per line) and the always-computed
// status (PRD §3), plus this is where the "Receive Stock" action lives
// (PRD §4) — receiving is only ever reached from a specific PO's context,
// never a standalone screen (PRD §2).
export function PurchaseOrderDetailPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();
  const navigate = useNavigate();

  const [showReceive, setShowReceive] = useState(false);

  const canRead = hasPermission('purchasing:read');
  // GOTCHA (PRD §2): gate strictly on `purchasing:update`, never
  // `purchasing:create` — receiving mutates an existing PO's state, a
  // different permission than creating a new PO.
  const canReceive = hasPermission('purchasing:update');

  const numericId = purchaseOrderId != null ? Number(purchaseOrderId) : NaN;

  const poQuery = useQuery({
    queryKey: ['purchasing', 'detail', tenantId, numericId],
    queryFn: ({ signal }) => fetchPurchaseOrder(tenantId as number, numericId, signal),
    enabled: tenantId != null && canRead && Number.isFinite(numericId),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: ({ signal }) => fetchSuppliers(tenantId as number, signal),
    enabled: tenantId != null && canRead,
  });

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', tenantId, 'all-active'],
    queryFn: ({ signal }) => fetchProducts(tenantId as number, { per_page: 200 }, signal),
    enabled: tenantId != null && canRead,
  });

  const receiptsQuery = useQuery({
    queryKey: ['purchasing', 'receipts', tenantId, numericId],
    queryFn: ({ signal }) => fetchStockReceipts(tenantId as number, numericId, signal),
    enabled: tenantId != null && canRead && Number.isFinite(numericId),
  });

  const supplierName = useMemo(() => {
    const supplier = (suppliersQuery.data?.data ?? []).find(
      (s) => s.supplierId === poQuery.data?.supplierId
    );
    return supplier?.name ?? (poQuery.data ? `Supplier #${poQuery.data.supplierId}` : '—');
  }, [suppliersQuery.data, poQuery.data]);

  const productNameById = useMemo(() => {
    const map = new Map<number, string>();
    (productsQuery.data?.data ?? []).forEach((p) => map.set(p.productId, p.name));
    return map;
  }, [productsQuery.data]);

  const lineColumns: ColumnDef<PurchaseOrderLine>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product',
        render: (r) => productNameById.get(r.productId) ?? `Product #${r.productId}`,
      },
      { key: 'quantityOrdered', header: 'Qty Ordered', render: (r) => r.quantityOrdered },
      { key: 'quantityReceived', header: 'Qty Received', render: (r) => r.quantityReceived },
      {
        key: 'outstanding',
        header: 'Outstanding',
        render: (r) => Math.max(0, r.quantityOrdered - r.quantityReceived),
      },
      {
        key: 'unitCost',
        header: 'Unit Cost',
        render: (r) => r.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      },
      {
        key: 'lineTotal',
        header: 'Line Total',
        render: (r) =>
          (r.quantityOrdered * r.unitCost).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          }),
      },
    ],
    [productNameById]
  );

  const receiptColumns: ColumnDef<StockReceipt>[] = useMemo(
    () => [
      { key: 'receiptId', header: 'Receipt #', render: (r) => `RCPT-${r.receiptId}` },
      {
        key: 'receivedAt',
        header: 'Received At',
        render: (r) => (r.receivedAt ? new Date(r.receivedAt).toLocaleString() : '—'),
      },
      { key: 'lines', header: 'Lines', render: (r) => r.lines.length },
      { key: 'notes', header: 'Notes', render: (r) => r.notes ?? '—' },
    ],
    []
  );

  if (!canRead) {
    return (
      <div>
        <Topbar title="Purchase Order" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view purchase orders.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Purchase Order" subtitle={tenantName ?? undefined} />

      <div style={{ padding: 32 }}>
        <button
          type="button"
          onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
          style={{
            background: 'none',
            border: 'none',
            color: T.indigo,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 16,
          }}
        >
          ← Back to Purchase Orders
        </button>

        {poQuery.isLoading ? (
          <Spinner size="sm" />
        ) : poQuery.isError || !poQuery.data ? (
          <div style={{ color: T.red }}>Couldn&apos;t load this purchase order.</div>
        ) : (
          <>
            <div
              className={styles.headerCard}
              style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
            >
              <div className={styles.headerTop}>
                <div>
                  <h2 className={styles.poTitle} style={{ color: T.text }}>
                    PO-{poQuery.data.purchaseOrderId}
                  </h2>
                  <div style={{ color: T.textMuted, fontSize: 13 }}>{supplierName}</div>
                </div>
                {(() => {
                  const c = statusColors(poQuery.data.status, T);
                  return (
                    <span
                      style={{
                        color: c.fg,
                        background: c.bg,
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '5px 14px',
                        borderRadius: 999,
                        height: 'fit-content',
                      }}
                    >
                      {statusLabel(poQuery.data.status)}
                    </span>
                  );
                })()}
              </div>

              <div className={styles.metaGrid} style={{ color: T.text }}>
                <div>
                  <div className={styles.metaLabel} style={{ color: T.textMuted }}>
                    Order Date
                  </div>
                  <div>
                    {poQuery.data.orderDate
                      ? new Date(poQuery.data.orderDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className={styles.metaLabel} style={{ color: T.textMuted }}>
                    Expected Delivery
                  </div>
                  <div>
                    {poQuery.data.expectedDeliveryDate
                      ? new Date(poQuery.data.expectedDeliveryDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className={styles.metaLabel} style={{ color: T.textMuted }}>
                    Notes
                  </div>
                  <div>{poQuery.data.notes ?? '—'}</div>
                </div>
              </div>

              {canReceive && (
                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    className={styles.receiveBtn}
                    style={{ background: T.indigo }}
                    onClick={() => setShowReceive(true)}
                  >
                    Receive Stock
                  </button>
                </div>
              )}
            </div>

            <h3 className={styles.sectionTitle} style={{ color: T.text }}>
              Lines
            </h3>
            <DataTable
              data={poQuery.data.lines}
              columns={lineColumns}
              getRowKey={(r) => r.lineId}
              emptyMessage="No lines on this purchase order."
            />

            <h3 className={styles.sectionTitle} style={{ color: T.text }}>
              Receipt History
            </h3>
            {receiptsQuery.isLoading ? (
              <Spinner size="sm" />
            ) : receiptsQuery.isError ? (
              <div style={{ color: T.red }}>Couldn&apos;t load receipt history.</div>
            ) : (
              <DataTable
                data={receiptsQuery.data?.data ?? []}
                columns={receiptColumns}
                getRowKey={(r) => r.receiptId}
                emptyMessage="No stock has been received against this purchase order yet."
              />
            )}

            {showReceive && tenantId != null && (
              <ReceiveStockModal
                tenantId={tenantId}
                purchaseOrder={poQuery.data}
                productNameById={productNameById}
                onClose={() => setShowReceive(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PurchaseOrderDetailPage;
