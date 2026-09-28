import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchSale, fetchSales, type SaleReceiptResponse } from '@/domains/sales/api/salesApi';
import { createReturn, ReturnsApiError, type ReturnResponse } from '../api/returnsApi';
import styles from './Returns.module.css';

interface MatchedReturnPanelProps {
  tenantId: number;
}

interface AllocationRow {
  saleLineBatchAllocationId: number;
  productName: string;
  unitPrice: number;
  originalQuantity: number;
}

function defaultDateRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  const toYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { dateFrom: toYmd(start), dateTo: toYmd(today) };
}

// STORY-052 — Return processing screen (matched case). Look up an original
// sale by Sale # (a cashier/customer references this from a physical/
// digital receipt) or by browsing the existing sales list (PRD §2 — there is
// deliberately no customer name/phone search, no backend support for it).
// Once the sale's lines/allocations load (this sprint's backend addition),
// pick which allocation(s)/quantity to return, capped client-side at each
// allocation's original quantity — the backend enforces the same bound via
// its row-lock guard, but this project's established pattern blocks the
// obviously-invalid case client-side too.
export function MatchedReturnPanel({ tenantId }: MatchedReturnPanelProps) {
  const { T } = useTheme();

  const [saleIdInput, setSaleIdInput] = useState('');
  const [activeSaleId, setActiveSaleId] = useState<number | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [reason, setReason] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnResponse | null>(null);

  const saleQuery = useQuery({
    queryKey: ['returns', 'sale-lookup', tenantId, activeSaleId],
    queryFn: ({ signal }) => fetchSale(tenantId, activeSaleId as number, signal),
    enabled: activeSaleId != null,
    retry: false,
  });

  const browseQuery = useQuery({
    queryKey: ['returns', 'sales-browse', tenantId, dateRange.dateFrom, dateRange.dateTo],
    queryFn: ({ signal }) =>
      fetchSales(
        tenantId,
        { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo, per_page: 50 },
        signal
      ),
    enabled: showBrowse,
  });

  // One row per allocation, not per sale line — a matched return targets a
  // specific SaleLineBatchAllocation, so a FEFO-spillover line (drawn from 2+
  // batches) surfaces as 2+ separately-returnable rows here (PRD §2/§3).
  const allocationRows: AllocationRow[] = useMemo(() => {
    const sale = saleQuery.data;
    if (!sale) return [];
    const rows: AllocationRow[] = [];
    sale.lines.forEach((line) => {
      line.allocations.forEach((allocation) => {
        rows.push({
          saleLineBatchAllocationId: allocation.saleLineBatchAllocationId,
          productName: line.productName,
          unitPrice: line.unitPrice,
          originalQuantity: allocation.quantity,
        });
      });
    });
    return rows;
  }, [saleQuery.data]);

  function resetSelection() {
    setResult(null);
    setQuantities({});
    setFormError(null);
  }

  function lookUp() {
    const parsed = Number(saleIdInput);
    if (!saleIdInput.trim() || !Number.isInteger(parsed) || parsed <= 0) {
      setFormError('Enter a valid Sale ID.');
      return;
    }
    resetSelection();
    setActiveSaleId(parsed);
  }

  function pickFromBrowse(sale: SaleReceiptResponse) {
    setSaleIdInput(String(sale.saleId));
    resetSelection();
    setActiveSaleId(sale.saleId);
  }

  function setQuantity(allocationId: number, cap: number, raw: number) {
    const safe = Number.isFinite(raw) ? Math.max(0, Math.min(cap, Math.floor(raw))) : 0;
    setQuantities((prev) => ({ ...prev, [allocationId]: safe }));
  }

  const returnMutation = useMutation({
    mutationFn: () =>
      createReturn(tenantId, {
        saleId: activeSaleId as number,
        reason: reason.trim(),
        lines: allocationRows
          .map((row) => ({
            saleLineBatchAllocationId: row.saleLineBatchAllocationId,
            quantity: quantities[row.saleLineBatchAllocationId] ?? 0,
          }))
          .filter((line) => line.quantity > 0),
      }),
    onSuccess: (ret) => {
      toast.success('Return processed.');
      setResult(ret);
    },
    onError: (err) => {
      toast.error(err instanceof ReturnsApiError ? err.message : 'Failed to process return.');
    },
  });

  function validate(): string | null {
    if (activeSaleId == null || !saleQuery.data) return 'Look up a sale first.';
    if (!reason.trim()) return 'Enter a reason for this return.';
    const anyQuantity = Object.values(quantities).some((q) => q > 0);
    if (!anyQuantity) return 'Enter a quantity to return for at least one line.';
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
    setActiveSaleId(null);
    setSaleIdInput('');
    setQuantities({});
    setReason('');
    setFormError(null);
  }

  const browseColumns: ColumnDef<SaleReceiptResponse>[] = useMemo(
    () => [
      { key: 'saleId', header: 'Sale #', render: (r) => `#${r.saleId}` },
      { key: 'saleDate', header: 'Date', render: (r) => r.saleDate ?? '—' },
      { key: 'customer', header: 'Customer', render: (r) => r.customer?.name ?? 'Walk-in' },
      { key: 'total', header: 'Total', render: (r) => r.total.toLocaleString() },
      {
        key: 'pick',
        header: '',
        render: (r) => (
          <button
            type="button"
            className={styles.smallBtn}
            style={{ color: T.indigo, borderColor: T.indigo }}
            onClick={() => pickFromBrowse(r)}
          >
            Use this sale
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [T]
  );

  if (result) {
    return (
      <div
        className={styles.panel}
        style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
      >
        <div className={styles.resultBanner} style={{ background: T.greenLight, color: T.green }}>
          Return #{result.returnId} processed for Sale #{result.saleId} — refund total{' '}
          <strong>{result.refundTotal.toLocaleString()}</strong>.
        </div>
        <table className={styles.lineTable}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ color: T.textMuted }}>Product</th>
              <th style={{ color: T.textMuted, textAlign: 'right' }}>Qty Returned</th>
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
          Process Another Return
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel} style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
      <p className={styles.hint} style={{ color: T.textMuted }}>
        Look up the original sale by its Sale # (shown on the customer&apos;s receipt), or browse
        recent sales below — there&apos;s no customer name/phone search (no backend support for
        linking a customer to their prior sales yet).
      </p>

      <div className={styles.row}>
        <label className={styles.label} style={{ color: T.textMuted }}>
          Sale #
          <input
            type="text"
            inputMode="numeric"
            value={saleIdInput}
            onChange={(e) => setSaleIdInput(e.target.value)}
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            placeholder="e.g. 128"
          />
        </label>
        <button
          type="button"
          className={styles.primaryBtn}
          style={{ background: T.indigo, marginTop: 20 }}
          onClick={lookUp}
        >
          Look Up
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          style={{ color: T.textMuted, borderColor: T.border, marginTop: 20 }}
          onClick={() => setShowBrowse((v) => !v)}
        >
          {showBrowse ? 'Hide recent sales' : 'Browse recent sales'}
        </button>
      </div>

      {showBrowse && (
        <div className={styles.browseWrap}>
          <div className={styles.row}>
            <label className={styles.label} style={{ color: T.textMuted }}>
              From
              <DatePicker
                value={dateRange.dateFrom}
                onChange={(v) => setDateRange((r) => ({ ...r, dateFrom: v }))}
              />
            </label>
            <label className={styles.label} style={{ color: T.textMuted }}>
              To
              <DatePicker
                value={dateRange.dateTo}
                onChange={(v) => setDateRange((r) => ({ ...r, dateTo: v }))}
              />
            </label>
          </div>
          {browseQuery.isLoading ? (
            <Spinner size="sm" />
          ) : browseQuery.isError ? (
            <div style={{ color: T.red, fontSize: 13 }}>Couldn&apos;t load recent sales.</div>
          ) : (
            <DataTable
              data={browseQuery.data?.data ?? []}
              columns={browseColumns}
              getRowKey={(r) => r.saleId}
              pageSize={5}
              emptyMessage="No sales in this date range."
            />
          )}
        </div>
      )}

      {activeSaleId != null && saleQuery.isLoading && <Spinner size="sm" />}
      {activeSaleId != null && saleQuery.isError && (
        <div className={styles.errorBanner} style={{ background: T.redLight, color: T.red }}>
          Couldn&apos;t find sale #{activeSaleId} for this tenant.
        </div>
      )}

      {saleQuery.data && (
        <>
          <h4 className={styles.subheading} style={{ color: T.text }}>
            Sale #{saleQuery.data.saleId} — {saleQuery.data.customer?.name ?? 'Walk-in'}
          </h4>

          <table className={styles.lineTable}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ color: T.textMuted }}>Product</th>
                <th style={{ color: T.textMuted, textAlign: 'right' }}>Sold Qty</th>
                <th style={{ color: T.textMuted, textAlign: 'right' }}>Unit Price</th>
                <th style={{ color: T.textMuted, textAlign: 'right' }}>Return Qty</th>
              </tr>
            </thead>
            <tbody>
              {allocationRows.map((row) => (
                <tr
                  key={row.saleLineBatchAllocationId}
                  style={{ borderBottom: `1px solid ${T.borderLight}` }}
                >
                  <td style={{ color: T.text }}>{row.productName}</td>
                  <td style={{ color: T.text, textAlign: 'right' }}>{row.originalQuantity}</td>
                  <td style={{ color: T.text, textAlign: 'right' }}>
                    {row.unitPrice.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      min={0}
                      max={row.originalQuantity}
                      value={quantities[row.saleLineBatchAllocationId] ?? 0}
                      onChange={(e) =>
                        setQuantity(
                          row.saleLineBatchAllocationId,
                          row.originalQuantity,
                          Number(e.target.value)
                        )
                      }
                      className={styles.qtyInput}
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </td>
                </tr>
              ))}
              {allocationRows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: T.textMuted }}>
                    This sale has no returnable lines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <label className={styles.label} style={{ color: T.textMuted }}>
            Reason *
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={styles.textarea}
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              maxLength={2000}
            />
          </label>

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
            {returnMutation.isPending ? 'Processing…' : 'Process Return'}
          </button>
        </>
      )}
    </div>
  );
}

export default MatchedReturnPanel;
