import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import { fetchSuppliers } from '@/domains/suppliers/api/suppliersApi';
import { fetchProducts, type Product } from '@/domains/catalog/api/catalogApi';
import { PurchasingApiError, createPurchaseOrder, type PurchaseOrder } from '../api/purchasingApi';
import styles from './PurchaseOrderFormModal.module.css';

interface PurchaseOrderFormModalProps {
  tenantId: number;
  onClose: () => void;
  onCreated?: (po: PurchaseOrder) => void;
}

interface DraftLine {
  key: number;
  productId: number | '';
  quantityOrdered: number | '';
  unitCost: number | '';
}

let lineKeySeq = 0;
function newLine(): DraftLine {
  return { key: ++lineKeySeq, productId: '', quantityOrdered: '', unitCost: '' };
}

const inputStyleBase = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  fontSize: 13,
  boxSizing: 'border-box' as const,
  fontFamily: "'DM Sans', sans-serif",
};

// STORY-047 — PO creation form: a supplier picker plus an add/remove-able
// list of product/quantity/cost lines (min 1, matching the backend's
// ArrayMinSize(1) client-side per PRD §3). Closest precedent is PosPage's
// cart-building pattern (Sprint 9), but without its live-quote/debounce
// complexity — PO lines don't need real-time re-validation against stock,
// they're just being typed in (PRD top-level context).
export function PurchaseOrderFormModal({
  tenantId,
  onClose,
  onCreated,
}: PurchaseOrderFormModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [formError, setFormError] = useState<string | null>(null);

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: ({ signal }) => fetchSuppliers(tenantId, signal),
  });

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', tenantId, 'all-active'],
    queryFn: ({ signal }) => fetchProducts(tenantId, { per_page: 200 }, signal),
  });

  const activeProducts: Product[] = useMemo(
    () => (productsQuery.data?.data ?? []).filter((p) => p.isActive),
    [productsQuery.data]
  );

  const createMutation = useMutation({
    mutationFn: () => {
      const payloadLines = lines.map((l) => ({
        productId: l.productId as number,
        quantityOrdered: l.quantityOrdered as number,
        unitCost: l.unitCost as number,
      }));
      return createPurchaseOrder(tenantId, {
        supplierId: supplierId as number,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes.trim() || undefined,
        lines: payloadLines,
      });
    },
    onSuccess: (po) => {
      toast.success('Purchase order created.');
      void queryClient.invalidateQueries({ queryKey: ['purchasing', 'list', tenantId] });
      if (onCreated) onCreated(po);
      else onClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof PurchasingApiError ? err.message : 'Failed to create purchase order.'
      );
    },
  });

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(key: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function updateLine(key: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function validate(): string | null {
    if (supplierId === '') return 'Select a supplier.';
    if (lines.length === 0) return 'Add at least one line.';
    for (const l of lines) {
      if (l.productId === '') return 'Every line needs a product.';
      if (l.quantityOrdered === '' || Number(l.quantityOrdered) < 1) {
        return 'Every line needs a quantity of at least 1.';
      }
      if (l.unitCost === '' || Number(l.unitCost) <= 0) {
        return 'Every line needs a unit cost greater than 0.';
      }
    }
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validate();
    setFormError(error);
    if (error) return;
    createMutation.mutate();
  }

  const inputStyle = {
    ...inputStyleBase,
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
  };

  return (
    <Modal onClose={onClose} width={760}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Create Purchase Order
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
        <div className={styles.row}>
          <label className={styles.label} style={{ color: T.textMuted }}>
            Supplier *
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))}
              style={inputStyle}
              autoFocus
            >
              <option value="">Select supplier…</option>
              {(suppliersQuery.data?.data ?? []).map((s) => (
                <option key={s.supplierId} value={s.supplierId}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label} style={{ color: T.textMuted }}>
            Expected Delivery Date
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            maxLength={2000}
          />
        </label>

        <div className={styles.linesHeader}>
          <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>Lines *</span>
          <button
            type="button"
            className={styles.addLineBtn}
            style={{ color: T.indigo }}
            onClick={addLine}
          >
            + Add Line
          </button>
        </div>

        <div className={styles.linesTable}>
          <div className={styles.linesTableHead} style={{ color: T.textMuted }}>
            <span>Product</span>
            <span>Quantity</span>
            <span>Unit Cost</span>
            <span />
          </div>
          {lines.map((line) => (
            <div key={line.key} className={styles.lineRow}>
              <select
                required
                value={line.productId}
                onChange={(e) =>
                  updateLine(line.key, {
                    productId: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
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
              <input
                type="number"
                required
                min={1}
                step={1}
                value={line.quantityOrdered}
                onChange={(e) =>
                  updateLine(line.key, {
                    quantityOrdered: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
              <input
                type="number"
                required
                min={0.01}
                step={0.01}
                value={line.unitCost}
                onChange={(e) =>
                  updateLine(line.key, {
                    unitCost: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
              <button
                type="button"
                className={styles.removeLineBtn}
                style={{ color: T.red }}
                disabled={lines.length <= 1}
                onClick={() => removeLine(line.key)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

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
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PurchaseOrderFormModal;
