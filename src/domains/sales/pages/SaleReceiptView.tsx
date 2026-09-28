import type { ReactNode } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';
import type { SaleReceiptResponse } from '../api/salesApi';
import styles from './SaleReceiptView.module.css';

interface SaleReceiptViewProps {
  receipt: SaleReceiptResponse;
  /** Rendered above the receipt card (e.g. "Sale complete" banner + "New Sale" button). Omit for a bare receipt. */
  headerActions?: ReactNode;
}

// Reused by both the inline post-checkout view (STORY-040) and the
// dedicated /pos/:saleId/receipt route (STORY-041, GET .../receipt) — one
// component renders SaleReceiptResponse exactly, per the PRD §4 note that
// both call sites must share this rendering, not duplicate it.
export function SaleReceiptView({ receipt, headerActions }: SaleReceiptViewProps) {
  const { T } = useTheme();

  const formattedDate = receipt.saleDate ? new Date(receipt.saleDate).toLocaleString() : '—';

  return (
    <div>
      {headerActions && <div className={styles.headerActions}>{headerActions}</div>}

      <div
        className={styles.receiptCard}
        style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.shadow }}
      >
        <div className={styles.receiptHeader}>
          <div>
            <div className={styles.saleTitle} style={{ color: T.text }}>
              Sale #{receipt.saleId}
            </div>
            <div className={styles.saleMeta} style={{ color: T.textMuted }}>
              {formattedDate}
            </div>
          </div>
          <button
            type="button"
            className={styles.printBtn}
            style={{ color: T.indigo, borderColor: T.indigo }}
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>

        <div className={styles.partyRow}>
          <div>
            <div className={styles.partyLabel} style={{ color: T.textMuted }}>
              Cashier
            </div>
            <div style={{ color: T.text, fontSize: 13 }}>
              {receipt.cashier ? `${receipt.cashier.firstName} ${receipt.cashier.lastName}` : '—'}
            </div>
          </div>
          <div>
            <div className={styles.partyLabel} style={{ color: T.textMuted }}>
              Customer
            </div>
            <div style={{ color: T.text, fontSize: 13 }}>
              {receipt.customer ? receipt.customer.name : 'Walk-in'}
            </div>
          </div>
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
            {receipt.lines.map((line) => (
              <tr key={line.productId} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
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

        <div className={styles.totalsBlock}>
          <div className={styles.totalsRow} style={{ color: T.textMuted }}>
            <span>Subtotal</span>
            <span>{receipt.subtotal.toLocaleString()}</span>
          </div>
          <div
            className={styles.totalsRow}
            style={{ color: T.text, fontWeight: 700, fontSize: 16 }}
          >
            <span>Total</span>
            <span>{receipt.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaleReceiptView;
