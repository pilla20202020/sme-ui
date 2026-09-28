import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchProducts, type Product } from '@/domains/catalog/api/catalogApi';
import { fetchOnHand } from '@/domains/inventory/api/inventoryApi';
import { fetchStaff, type StaffMember } from '@/domains/staff/api/staffApi';
import { createReturn, ReturnsApiError, type ReturnResponse } from '../api/returnsApi';
import styles from './Returns.module.css';

interface OverrideReturnPanelProps {
  tenantId: number;
}

interface DraftLine {
  key: string;
  productId: number;
  productName: string;
  productBatchId: number;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
}

// STORY-053 — Manager override screen for unmatched returns (no saleId at
// all). Reuses Sprint 13's inventory on-hand/batch-picking pattern
// (catalog's fetchProducts → inventory's fetchOnHand for that product's
// batches) plus Sprint 10's staff list (fetchStaff) so the cashier picks an
// approving manager by name rather than typing a raw numeric userId (PRD
// §4). Unit price has no original sale to default from — manual entry,
// matching the backend's own design. Builds a small local "cart" of lines
// (the backend's CreateReturnDto already accepts an array) before a single
// submit with one shared reason + one shared overrideApprovedBy.
export function OverrideReturnPanel({ tenantId }: OverrideReturnPanelProps) {
  const { T } = useTheme();

  const [productId, setProductId] = useState<number | ''>('');
  const [productBatchId, setProductBatchId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [reason, setReason] = useState('');
  const [approverId, setApproverId] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnResponse | null>(null);

  const productsQuery = useQuery({
    queryKey: ['returns', 'override', 'products', tenantId],
    queryFn: ({ signal }) => fetchProducts(tenantId, { per_page: 100 }, signal),
  });
  const activeProducts: Product[] = useMemo(
    () => (productsQuery.data?.data ?? []).filter((p) => p.isActive),
    [productsQuery.data]
  );

  const onHandQuery = useQuery({
    queryKey: ['returns', 'override', 'on-hand', tenantId, productId],
    queryFn: ({ signal }) => fetchOnHand(tenantId, productId as number, signal),
    enabled: productId !== '',
  });
  const batches = useMemo(() => onHandQuery.data?.batches ?? [], [onHandQuery.data]);

  const staffQuery = useQuery({
    queryKey: ['returns', 'override', 'staff', tenantId],
    queryFn: ({ signal }) => fetchStaff(tenantId, signal),
  });
  const staff: StaffMember[] = useMemo(() => staffQuery.data?.data ?? [], [staffQuery.data]);

  // Same "never carry a stale batch across a product change" rule
  // AdjustStockModal follows (PRD §2 analogue).
  useEffect(() => {
    setProductBatchId('');
  }, [productId]);

  function addLine() {
    if (productId === '' || productBatchId === '' || quantity === '' || unitPrice === '') {
      setFormError('Fill in product, batch, quantity, and unit price before adding a line.');
      return;
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      setFormError('Quantity must be a whole number greater than zero.');
      return;
    }
    if (Number(unitPrice) <= 0) {
      setFormError('Unit price must be greater than zero.');
      return;
    }
    const product = activeProducts.find((p) => p.productId === productId);
    const batch = batches.find((b) => b.batchId === productBatchId);
    setLines((prev) => [
      ...prev,
      {
        key: `${productId}-${productBatchId}-${Date.now()}`,
        productId: productId as number,
        productName: product?.name ?? `Product ${productId}`,
        productBatchId: productBatchId as number,
        batchNumber: batch?.batchNumber ?? String(productBatchId),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      },
    ]);
    setFormError(null);
    setProductId('');
    setProductBatchId('');
    setQuantity('');
    setUnitPrice('');
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const returnMutation = useMutation({
    mutationFn: () =>
      createReturn(tenantId, {
        reason: reason.trim(),
        overrideApprovedBy: approverId as number,
        lines: lines.map((l) => ({
          productId: l.productId,
          productBatchId: l.productBatchId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      }),
    onSuccess: (ret) => {
      toast.success('Override return processed.');
      setResult(ret);
    },
    onError: (err) => {
      // Surfaces the backend's specific message legibly — in particular the
      // 403 when the named approver lacks returns:override (PRD §4/STORY-053
      // AC) — never a raw dump.
      toast.error(err instanceof ReturnsApiError ? err.message : 'Failed to process return.');
    },
  });

  function validate(): string | null {
    if (lines.length === 0) return 'Add at least one return line.';
    if (!reason.trim()) return 'Enter a reason for this return.';
    if (approverId === '') return 'Select an approving manager.';
    return null;
  }

  function handleSubmit() {
    const error = validate();
    setFormError(error);
    if (error) return;
    returnMutation.mutate();
  }

  function startOver() {
    setResult(null);
    setLines([]);
    setReason('');
    setApproverId('');
    setFormError(null);
  }

  const inputStyle = {
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
  };

  if (result) {
    return (
      <div
        className={styles.panel}
        style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
      >
        <div className={styles.resultBanner} style={{ background: T.greenLight, color: T.green }}>
          Override return #{result.returnId} processed — refund total{' '}
          <strong>{result.refundTotal.toLocaleString()}</strong>.
        </div>
        <table className={styles.lineTable}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ color: T.textMuted }}>Product</th>
              <th style={{ color: T.textMuted, textAlign: 'right' }}>Qty</th>
              <th style={{ color: T.textMuted, textAlign: 'right' }}>Unit Price</th>
              <th style={{ color: T.textMuted, textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((line) => (
              <tr key={line.returnLineId} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ color: T.text }}>{line.productName}</td>
                <td style={{ color: T.text, textAlign: 'right' }}>{line.quantity}</td>
                <td style={{ color: T.text, textAlign: 'right' }}>
                  {line.unitPrice.toLocaleString()}
                </td>
                <td style={{ color: T.text, textAlign: 'right' }}>
                  {line.lineTotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className={styles.primaryBtn}
          style={{ background: T.indigo }}
          onClick={startOver}
        >
          Process Another Override Return
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel} style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
      <p className={styles.hint} style={{ color: T.textMuted }}>
        For a return with no original sale to match — e.g. a walk-in with no receipt. Requires a
        named approver with returns:override; there&apos;s no original sale price to default the
        unit price from, so it&apos;s entered manually.
      </p>

      <div className={styles.row}>
        <label className={styles.label} style={{ color: T.textMuted }}>
          Product
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
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
            // Real, observed gap (mirrors AdjustStockModal's own flagged
            // gotcha, Sprint 13): cashier holds returns:create but not
            // catalog:read, so this dropdown comes up empty for that role —
            // surfaced here rather than failing silently. Not a frontend
            // gating bug; flagged in impl-notes.md.
            <div style={{ color: T.red, fontSize: 12, fontWeight: 600 }}>
              Couldn&apos;t load the product list — you may be missing permission to view the
              catalog.
            </div>
          )}
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Batch
          {productId === '' ? (
            <select disabled value="" style={inputStyle}>
              <option value="">Select a product first…</option>
            </select>
          ) : onHandQuery.isLoading ? (
            <Spinner size="sm" />
          ) : onHandQuery.isError ? (
            <div style={{ color: T.red, fontSize: 12, fontWeight: 600 }}>
              Couldn&apos;t load batches — you may be missing permission to view inventory.
            </div>
          ) : (
            <select
              value={productBatchId}
              onChange={(e) =>
                setProductBatchId(e.target.value === '' ? '' : Number(e.target.value))
              }
              style={inputStyle}
            >
              <option value="">Select batch…</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchNumber} (on hand: {b.quantityRemaining})
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.label} style={{ color: T.textMuted }}>
          Quantity
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
          />
        </label>
        <label className={styles.label} style={{ color: T.textMuted }}>
          Unit Price
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
          />
        </label>
        <button
          type="button"
          className={styles.secondaryBtn}
          style={{ color: T.indigo, borderColor: T.indigo, marginTop: 20 }}
          onClick={addLine}
        >
          + Add Line
        </button>
      </div>

      {lines.length > 0 && (
        <table className={styles.lineTable}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ color: T.textMuted }}>Product</th>
              <th style={{ color: T.textMuted }}>Batch</th>
              <th style={{ color: T.textMuted, textAlign: 'right' }}>Qty</th>
              <th style={{ color: T.textMuted, textAlign: 'right' }}>Unit Price</th>
              <th style={{ color: T.textMuted }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ color: T.text }}>{l.productName}</td>
                <td style={{ color: T.text }}>{l.batchNumber}</td>
                <td style={{ color: T.text, textAlign: 'right' }}>{l.quantity}</td>
                <td style={{ color: T.text, textAlign: 'right' }}>
                  {l.unitPrice.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    style={{ color: T.red }}
                    onClick={() => removeLine(l.key)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <label className={styles.label} style={{ color: T.textMuted }}>
        Reason *
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={styles.textarea}
          style={inputStyle}
          maxLength={2000}
        />
      </label>

      <label className={styles.label} style={{ color: T.textMuted }}>
        Approved By *
        {staffQuery.isLoading ? (
          <Spinner size="sm" />
        ) : staffQuery.isError ? (
          <div style={{ color: T.red, fontSize: 12, fontWeight: 600 }}>
            Couldn&apos;t load the staff list — you may be missing permission to view staff.
          </div>
        ) : (
          <select
            value={approverId}
            onChange={(e) => setApproverId(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
          >
            <option value="">Select approving manager…</option>
            {staff.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.firstName} {s.lastName} ({s.email})
              </option>
            ))}
          </select>
        )}
      </label>
      <p className={styles.hint} style={{ color: T.textMuted, fontSize: 11 }}>
        Any staff member can be picked here — there&apos;s no &quot;search staff by permission&quot;
        endpoint (PRD §4), so the backend is the final authority: it rejects the request with a
        legible 403 if the chosen person doesn&apos;t actually hold returns:override.
      </p>

      {formError && (
        <div className={styles.errorBanner} style={{ background: T.redLight, color: T.red }}>
          {formError}
        </div>
      )}

      <button
        type="button"
        className={styles.primaryBtn}
        style={{ background: T.indigo }}
        disabled={returnMutation.isPending}
        onClick={handleSubmit}
      >
        {returnMutation.isPending ? 'Processing…' : 'Process Override Return'}
      </button>
    </div>
  );
}

export default OverrideReturnPanel;
