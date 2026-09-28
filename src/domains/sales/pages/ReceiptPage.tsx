import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchSaleReceipt } from '../api/salesApi';
import { SaleReceiptView } from './SaleReceiptView';
import { ROUTES } from '@/app/router/routeConfig';

// Dedicated route (STORY-041, PRD §4): /pos/:saleId/receipt — for reopening
// a completed sale's receipt directly (e.g. a future "view receipt" link
// from the sales list), reusing the exact same SaleReceiptView the
// post-checkout inline flow in PosPage renders.
export function ReceiptPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();

  const canRead = hasPermission('sales:read');
  const numericSaleId = saleId != null ? Number(saleId) : NaN;

  const receiptQuery = useQuery({
    queryKey: ['sales', 'receipt', tenantId, numericSaleId],
    queryFn: ({ signal }) => fetchSaleReceipt(tenantId as number, numericSaleId, signal),
    enabled: tenantId != null && canRead && Number.isFinite(numericSaleId),
  });

  if (!canRead) {
    return (
      <div>
        <Topbar title="Receipt" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view sale receipts.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Receipt" subtitle={tenantName ?? undefined} />
      <div style={{ padding: 32 }}>
        <button
          type="button"
          className="print-hide"
          onClick={() => navigate(ROUTES.POS)}
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
          ← Back to POS
        </button>

        {receiptQuery.isLoading ? (
          <Spinner size="sm" />
        ) : receiptQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load this receipt.</div>
        ) : receiptQuery.data ? (
          <SaleReceiptView receipt={receiptQuery.data} />
        ) : null}
      </div>
    </div>
  );
}

export default ReceiptPage;
