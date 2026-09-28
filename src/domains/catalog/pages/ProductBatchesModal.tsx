import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import type { ThemeTokens } from '@/shared/theme/types';
import { Modal } from '@/shared/components/ui';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchProductBatches, type ProductBatch } from '../api/catalogApi';
import styles from './ProductBatchesModal.module.css';

interface ProductBatchesModalProps {
  tenantId: number;
  productId: number;
  productName: string;
  onClose: () => void;
}

// Reuses the same 30-day window the backend's near-expiry alert endpoint
// uses (GET /inventory/alerts/near-expiry) — for display styling only, no
// second data source is called here (PRD §4).
//
// Exported (Sprint 13, STORY-049/050/051, EPIC-005 UI PRD §2): the inventory
// domain's adjustment batch picker and near-expiry alert list reuse this
// exact day-math/styling logic rather than re-implementing it — do not
// duplicate this constant or the two functions below anywhere else.
export const NEAR_EXPIRY_WINDOW_DAYS = 30;

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = parsed.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface ExpiryDisplayStyle {
  color: string;
  fontWeight: number;
  isExpired: boolean;
  isNearExpiry: boolean;
}

export function expiryDisplayStyle(days: number | null, T: ThemeTokens): ExpiryDisplayStyle {
  const isNearExpiry = days != null && days <= NEAR_EXPIRY_WINDOW_DAYS;
  const isExpired = days != null && days < 0;
  return {
    color: isExpired ? T.red : isNearExpiry ? T.amber : T.text,
    fontWeight: isNearExpiry || isExpired ? 700 : 400,
    isExpired,
    isNearExpiry,
  };
}

export function ProductBatchesModal({
  tenantId,
  productId,
  productName,
  onClose,
}: ProductBatchesModalProps) {
  const { T } = useTheme();

  const batchesQuery = useQuery({
    queryKey: ['catalog', 'batches', tenantId, productId],
    queryFn: ({ signal }) => fetchProductBatches(tenantId, productId, signal),
  });

  const columns: ColumnDef<ProductBatch>[] = [
    { key: 'batchNumber', header: 'Batch #', render: (r) => r.batchNumber },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (r) => {
        const days = daysUntil(r.expiryDate);
        const style = expiryDisplayStyle(days, T);
        return (
          <span style={{ color: style.color, fontWeight: style.fontWeight }}>
            {r.expiryDate ?? '—'}
            {style.isExpired && ' (expired)'}
            {!style.isExpired && style.isNearExpiry && ' (near expiry)'}
          </span>
        );
      },
    },
    { key: 'quantityReceived', header: 'Qty Received', render: (r) => r.quantityReceived },
    { key: 'quantityRemaining', header: 'Qty Remaining', render: (r) => r.quantityRemaining },
    { key: 'receivedAt', header: 'Received At', render: (r) => r.receivedAt ?? '—' },
  ];

  return (
    <Modal onClose={onClose} width={720}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Batches — {productName}
        </h2>
        <button
          type="button"
          className={styles.closeBtn}
          style={{ color: T.textMuted }}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className={styles.body}>
        {batchesQuery.isLoading ? (
          <Spinner size="sm" />
        ) : batchesQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load batches for this product.</div>
        ) : (
          <DataTable
            data={batchesQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.batchId}
            emptyMessage="No batches received for this product yet."
          />
        )}
      </div>
    </Modal>
  );
}

export default ProductBatchesModal;
