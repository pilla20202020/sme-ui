import { useEffect, useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchProducts, type Product } from '@/domains/catalog/api/catalogApi';
import { daysUntil, expiryDisplayStyle } from '@/domains/catalog/pages/ProductBatchesModal';
import { fetchOnHand, createAdjustment, InventoryApiError } from '../api/inventoryApi';
import styles from './AdjustStockModal.module.css';

interface AdjustStockModalProps {
  tenantId: number;
  initialProductId?: number;
  onClose: () => void;
}

type Direction = 'increase' | 'decrease';

const inputStyleBase = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  fontSize: 13,
  boxSizing: 'border-box' as const,
  fontFamily: "'DM Sans', sans-serif",
};

// STORY-050 — Manual stock adjustment screen. Self-contained product picker
// (reuses catalog's fetchProducts, PRD §4) → batch picker sourced from the
// on-hand endpoint's `batches` array (PRD §2 — NOT catalog's full batches
// endpoint, which returns extra fields this form doesn't need) → a
// direction + quantity pair that composes into the signed `quantityDelta`
// the backend expects, so the UI can never construct a zero delta (PRD §2
// hard requirement: "disable submission on a zero delta with a clear
// message"). Reason is required, trimmed before both the client check and
// the request body (mirrors the backend's own trim-then-validate rule).
//
// Never reachable without picking a specific batch first — there is no
// "adjust something" bare form (PRD §2).
export function AdjustStockModal({ tenantId, initialProductId, onClose }: AdjustStockModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState<number | ''>(initialProductId ?? '');
  const [productBatchId, setProductBatchId] = useState<number | ''>('');
  const [direction, setDirection] = useState<Direction>('increase');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<{ quantityRemaining: number; batchNumber: string } | null>(
    null
  );

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', tenantId, 'all-active'],
    queryFn: ({ signal }) => fetchProducts(tenantId, { per_page: 100 }, signal),
  });

  const activeProducts: Product[] = useMemo(
    () => (productsQuery.data?.data ?? []).filter((p) => p.isActive),
    [productsQuery.data]
  );

  const onHandQuery = useQuery({
    queryKey: ['inventory', 'on-hand', tenantId, productId],
    queryFn: ({ signal }) => fetchOnHand(tenantId, productId as number, signal),
    enabled: productId !== '',
  });

  const batches = useMemo(() => onHandQuery.data?.batches ?? [], [onHandQuery.data]);

  // Reset the batch selection whenever the product changes so a stale
  // batchId from a previous product can never be submitted (PRD §2 — one
  // batch per adjustment, always in the context of the currently-picked
  // product).
  useEffect(() => {
    setProductBatchId('');
  }, [productId]);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.batchId === productBatchId),
    [batches, productBatchId]
  );

  const adjustMutation = useMutation({
    mutationFn: () => {
      const amount = Number(quantity);
      const delta = direction === 'increase' ? amount : -amount;
      return createAdjustment(tenantId, productId as number, {
        productBatchId: productBatchId as number,
        quantityDelta: delta,
        reason: reason.trim(),
      });
    },
    onSuccess: (response) => {
      toast.success('Adjustment recorded.');
      setResult({
        quantityRemaining: response.quantityRemaining,
        batchNumber: selectedBatch?.batchNumber ?? String(productBatchId),
      });
      void queryClient.invalidateQueries({ queryKey: ['inventory', 'movements', tenantId] });
      void queryClient.invalidateQueries({
        queryKey: ['inventory', 'on-hand', tenantId, productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inventory', 'alerts', 'low-stock', tenantId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inventory', 'alerts', 'near-expiry', tenantId],
      });
    },
    onError: (err) => {
      // Surfaces the backend's specific message legibly (409 would-go-
      // negative, 404 batch not found, etc.) rather than a raw dump —
      // matching this project's established onError pattern (PRD §4 AC).
      toast.error(err instanceof InventoryApiError ? err.message : 'Failed to record adjustment.');
    },
  });

  function validate(): string | null {
    if (productId === '') return 'Select a product.';
    if (productBatchId === '') return 'Select a batch.';
    if (quantity === '' || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return 'Enter a whole quantity greater than zero.';
    }
    // Defensive: the direction+quantity UI can never itself construct a
    // zero delta (quantity must be >= 1), but the backend's own rule
    // ("quantityDelta cannot be zero") is re-checked here explicitly so a
    // future UI change to this form can't silently regress past it.
    const amount = Number(quantity);
    const delta = direction === 'increase' ? amount : -amount;
    if (delta === 0) return 'Quantity change cannot be zero.';
    if (!reason.trim()) return 'Enter a reason for this adjustment.';
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validate();
    setFormError(error);
    if (error) return;
    adjustMutation.mutate();
  }

  const inputStyle = {
    ...inputStyleBase,
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
  };

  if (result) {
    return (
      <Modal onClose={onClose} width={520}>
        <div className={styles.header}>
          <h2 className={styles.title} style={{ color: T.text }}>
            Adjustment Recorded
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

        <div className={styles.form}>
          <div className={styles.resultBanner} style={{ background: T.greenLight, color: T.green }}>
            Batch {result.batchNumber}&apos;s quantity remaining is now{' '}
            <strong>{result.quantityRemaining}</strong>.
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.primaryBtn}
              style={{ background: T.indigo }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} width={560}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Adjust Stock
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

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} style={{ color: T.textMuted }}>
          Product *
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
            autoFocus
          >
            <option value="">Select product…</option>
            {activeProducts.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.name}
                {p.sku ? ` (${p.sku})` : ''}
              </option>
            ))}
          </select>
          {productsQuery.isError && (
            // Real, observed gap (Sprint 13 verification): the seed
            // `inventory_staff` role holds inventory:read/inventory:adjust
            // but NOT catalog:read, and GET /products requires catalog:read
            // — so this dropdown comes up empty for that role even though
            // it can otherwise use this form. Surfaced here rather than
            // failing silently; not a frontend gating bug, flagged in
            // impl-notes.md for QA/PM (out of scope to fix: no backend
            // changes this sprint, PRD §2).
            <div style={{ color: T.red, fontSize: 12, fontWeight: 600 }}>
              Couldn&apos;t load the product list — you may be missing permission to view the
              catalog.
            </div>
          )}
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Batch *
          {productId === '' ? (
            <select disabled value="" style={inputStyle}>
              <option value="">Select a product first…</option>
            </select>
          ) : onHandQuery.isLoading ? (
            <Spinner size="sm" />
          ) : onHandQuery.isError ? (
            <div style={{ color: T.red, fontSize: 13 }}>Couldn&apos;t load batches.</div>
          ) : (
            <select
              required
              value={productBatchId}
              onChange={(e) =>
                setProductBatchId(e.target.value === '' ? '' : Number(e.target.value))
              }
              style={inputStyle}
            >
              <option value="">Select batch…</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchNumber} (Qty remaining: {b.quantityRemaining})
                </option>
              ))}
            </select>
          )}
        </label>

        {selectedBatch &&
          (() => {
            const style = expiryDisplayStyle(daysUntil(selectedBatch.expiryDate), T);
            return (
              <div className={styles.batchHint} style={{ color: style.color }}>
                Expiry: {selectedBatch.expiryDate ?? '—'}
                {style.isExpired && ' (expired)'}
                {!style.isExpired && style.isNearExpiry && ' (near expiry)'}
              </div>
            );
          })()}

        <div className={styles.row}>
          <label className={styles.label} style={{ color: T.textMuted }}>
            Adjustment Type *
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
              style={inputStyle}
            >
              <option value="increase">Add stock (found extra)</option>
              <option value="decrease">Remove stock (damage/loss/correction)</option>
            </select>
          </label>

          <label className={styles.label} style={{ color: T.textMuted }}>
            Quantity *
            <input
              type="number"
              required
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              style={inputStyle}
            />
          </label>
        </div>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Reason *
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            maxLength={2000}
          />
        </label>

        {formError && (
          <div className={styles.errorBanner} style={{ background: T.redLight, color: T.red }}>
            {formError}
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryBtn}
            style={{ color: T.textMuted, borderColor: T.border }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.primaryBtn}
            style={{ background: T.indigo }}
            disabled={adjustMutation.isPending}
          >
            {adjustMutation.isPending ? 'Recording…' : 'Record Adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AdjustStockModal;
