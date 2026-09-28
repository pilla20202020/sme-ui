import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { fetchBranches } from '@/domains/branches/api/branchesApi';
import { ExpensesApiError, createExpense, type Expense } from '../api/expensesApi';
import styles from './ExpenseFormModal.module.css';

interface ExpenseFormModalProps {
  tenantId: number;
  onClose: () => void;
  onCreated?: (expense: Expense) => void;
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const inputStyleBase = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  fontSize: 13,
  boxSizing: 'border-box' as const,
  fontFamily: "'DM Sans', sans-serif",
};

// STORY-054 — Expense entry form: branch picker (reusing fetchBranches,
// Sprint 10), category (free text, no fixed taxonomy per PRD §2/§3),
// amount (positive, 2 decimals), optional description, and expense date
// (defaulting to today). Closest precedent is PurchaseOrderFormModal
// (Sprint 12), but with a single flat set of fields instead of an
// add/remove-able line list — there's nothing here that repeats.
export function ExpenseFormModal({ tenantId, onClose, onCreated }: ExpenseFormModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayYmd());
  const [formError, setFormError] = useState<string | null>(null);

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: ({ signal }) => fetchBranches(tenantId, signal),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createExpense(tenantId, {
        branchId: branchId as number,
        category: category.trim(),
        amount: amount as number,
        description: description.trim() || undefined,
        expenseDate,
      }),
    onSuccess: (expense) => {
      toast.success('Expense recorded.');
      void queryClient.invalidateQueries({ queryKey: ['expenses', 'list', tenantId] });
      if (onCreated) onCreated(expense);
      else onClose();
    },
    onError: (err) => {
      toast.error(err instanceof ExpensesApiError ? err.message : 'Failed to record expense.');
    },
  });

  function validate(): string | null {
    if (branchId === '') return 'Select a branch.';
    if (!category.trim()) return 'Category is required.';
    if (amount === '' || Number(amount) <= 0) return 'Amount must be greater than 0.';
    if (!expenseDate) return 'Select an expense date.';
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
    <Modal onClose={onClose} width={480}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Record Expense
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
          Branch *
          <select
            required
            value={branchId}
            onChange={(e) => setBranchId(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
            autoFocus
          >
            <option value="">Select branch…</option>
            {(branchesQuery.data?.data ?? []).map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Category *
          <input
            type="text"
            required
            maxLength={100}
            placeholder="e.g. Rent, Utilities, Staff Welfare…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label} style={{ color: T.textMuted }}>
            Amount *
            <input
              type="number"
              required
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              style={inputStyle}
            />
          </label>

          <label className={styles.label} style={{ color: T.textMuted }}>
            Expense Date *
            <DatePicker value={expenseDate} onChange={setExpenseDate} />
          </label>
        </div>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
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
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving…' : 'Save Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ExpenseFormModal;
