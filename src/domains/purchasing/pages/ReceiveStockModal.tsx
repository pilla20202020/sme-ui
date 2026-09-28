import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import {
  PurchasingApiError,
  createStockReceipt,
  type PurchaseOrder,
  type StockReceiptCreateResponse,
} from '../api/purchasingApi';
import styles from './ReceiveStockModal.module.css';

interface ReceiveStockModalProps {
  tenantId: number;
  purchaseOrder: PurchaseOrder;
  productNameById: Map<number, string>;
  onClose: () => void;
}

interface DraftReceiptLine {
  lineId: number;
  productId: number;
  outstanding: number;
  include: boolean;
  quantityReceived: number | '';
  batchNumber: string;
  expiryDate: string;
  unitCost: number | '';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusLabel(status: string): string {
  if (status === 'partially_received') return 'Partially Received';
  if (status === 'received') return 'Received';
  return 'Pending';
}

// STORY-048 — Stock receiving screen, reached only from a specific PO's
// detail view (PRD §2/§4 — never a standalone "receive stock" screen).
// Pre-populates one row per PO line showing quantityOrdered -
// quantityReceived as outstanding context (PRD §4); a line can be left
// unchecked to receive only some of the PO's lines in this event.
//
// Discrepancies (quantityReceivedThisReceipt !== outstandingBeforeReceipt,
// either direction) are informational — the receipt always succeeds, so
// this component never blocks submission on a mismatch, only on missing/
// invalid input (PRD §2 hard requirement).
export function ReceiveStockModal({
  tenantId,
  purchaseOrder,
  productNameById,
  onClose,
}: ReceiveStockModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [lines, setLines] = useState<DraftReceiptLine[]>(() =>
    purchaseOrder.lines.map((l) => {
      const outstanding = Math.max(0, l.quantityOrdered - l.quantityReceived);
      return {
        lineId: l.lineId,
        productId: l.productId,
        outstanding,
        include: outstanding > 0,
        quantityReceived: outstanding > 0 ? outstanding : '',
        batchNumber: '',
        expiryDate: '',
        unitCost: l.unitCost,
      };
    })
  );
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<StockReceiptCreateResponse | null>(null);

  const receiveMutation = useMutation({
    mutationFn: () => {
      const included = lines.filter((l) => l.include);
      return createStockReceipt(tenantId, purchaseOrder.purchaseOrderId, {
        notes: notes.trim() || undefined,
        lines: included.map((l) => ({
          purchaseOrderLineId: l.lineId,
          quantityReceived: l.quantityReceived as number,
          batchNumber: l.batchNumber.trim(),
          expiryDate: l.expiryDate,
          unitCost: l.unitCost as number,
        })),
      });
    },
    onSuccess: (response) => {
      toast.success('Receipt recorded.');
      setResult(response);
      // Refresh the PO detail (updated quantityReceived/status) and the list
      // (updated status badge) without a full page reload (PRD §4 AC).
      void queryClient.invalidateQueries({
        queryKey: ['purchasing', 'detail', tenantId, purchaseOrder.purchaseOrderId],
      });
      void queryClient.invalidateQueries({ queryKey: ['purchasing', 'list', tenantId] });
      void queryClient.invalidateQueries({
        queryKey: ['purchasing', 'receipts', tenantId, purchaseOrder.purchaseOrderId],
      });
    },
    onError: (err) => {
      toast.error(err instanceof PurchasingApiError ? err.message : 'Failed to record receipt.');
    },
  });

  function updateLine(lineId: number, patch: Partial<DraftReceiptLine>) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  }

  function validate(): string | null {
    const included = lines.filter((l) => l.include);
    if (included.length === 0) return 'Select at least one line to receive.';
    for (const l of included) {
      if (l.quantityReceived === '' || Number(l.quantityReceived) < 1) {
        return 'Every included line needs a quantity received of at least 1.';
      }
      if (!l.batchNumber.trim()) return 'Every included line needs a batch number.';
      if (!l.expiryDate) return 'Every included line needs an expiry date.';
      if (l.expiryDate < todayIso()) return 'Expiry date cannot be in the past.';
      if (l.unitCost === '' || Number(l.unitCost) <= 0) {
        return 'Every included line needs a unit cost greater than 0.';
      }
    }
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validate();
    setFormError(error);
    if (error) return;
    receiveMutation.mutate();
  }

  const inputStyle = {
    width: '100%',
    padding: '7px 9px',
    borderRadius: 8,
    fontSize: 13,
    boxSizing: 'border-box' as const,
    fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
  };

  if (result) {
    return (
      <Modal onClose={onClose} width={640}>
        <div className={styles.header}>
          <h2 className={styles.title} style={{ color: T.text }}>
            Receipt Recorded
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
          <div className={styles.statusBanner} style={{ background: T.greenLight, color: T.green }}>
            Purchase order status is now <strong>{statusLabel(result.purchaseOrderStatus)}</strong>.
          </div>

          {result.discrepancies.length > 0 && (
            <div className={styles.discrepancyBanner} style={{ background: T.amberLight }}>
              <strong style={{ color: T.amber }}>Discrepancies noted (not an error):</strong>
              <ul className={styles.discrepancyList} style={{ color: T.text }}>
                {result.discrepancies.map((d) => {
                  const name = productNameById.get(d.productId) ?? `Product #${d.productId}`;
                  const diff = d.outstandingBeforeReceipt - d.quantityReceivedThisReceipt;
                  const message =
                    diff > 0
                      ? `expected ${diff} more, received ${d.quantityReceivedThisReceipt}`
                      : `received ${d.quantityReceivedThisReceipt}, only ${d.outstandingBeforeReceipt} were outstanding`;
                  return (
                    <li key={d.purchaseOrderLineId}>
                      {name}: {message}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {result.discrepancies.length === 0 && (
            <div className={styles.statusBanner} style={{ background: T.blueLight, color: T.blue }}>
              No discrepancies — received quantities matched what was outstanding.
            </div>
          )}

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
    <Modal onClose={onClose} width={820}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Receive Stock — PO-{purchaseOrder.purchaseOrderId}
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
        <div className={styles.linesTable}>
          <div className={styles.linesTableHead} style={{ color: T.textMuted }}>
            <span />
            <span>Product</span>
            <span>Outstanding</span>
            <span>Qty Received</span>
            <span>Batch #</span>
            <span>Expiry</span>
            <span>Unit Cost</span>
          </div>
          {lines.map((line) => (
            <div key={line.lineId} className={styles.lineRow}>
              <input
                type="checkbox"
                checked={line.include}
                onChange={(e) => updateLine(line.lineId, { include: e.target.checked })}
              />
              <span style={{ color: T.text, fontSize: 13 }}>
                {productNameById.get(line.productId) ?? `Product #${line.productId}`}
              </span>
              <span style={{ color: T.textMuted, fontSize: 13 }}>{line.outstanding}</span>
              <input
                type="number"
                min={1}
                step={1}
                disabled={!line.include}
                value={line.quantityReceived}
                onChange={(e) =>
                  updateLine(line.lineId, {
                    quantityReceived: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
              <input
                type="text"
                maxLength={100}
                disabled={!line.include}
                value={line.batchNumber}
                onChange={(e) => updateLine(line.lineId, { batchNumber: e.target.value })}
                style={inputStyle}
              />
              <input
                type="date"
                min={todayIso()}
                disabled={!line.include}
                value={line.expiryDate}
                onChange={(e) => updateLine(line.lineId, { expiryDate: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min={0.01}
                step={0.01}
                disabled={!line.include}
                value={line.unitCost}
                onChange={(e) =>
                  updateLine(line.lineId, {
                    unitCost: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }}
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
            disabled={receiveMutation.isPending}
          >
            {receiveMutation.isPending ? 'Recording…' : 'Record Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ReceiveStockModal;
