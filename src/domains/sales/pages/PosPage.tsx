import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchProducts, type Product } from '@/domains/catalog/api/catalogApi';
import {
  SalesApiError,
  checkoutSale,
  quoteSale,
  type QuoteResponse,
  type SaleReceiptResponse,
} from '../api/salesApi';
import { SaleReceiptView } from './SaleReceiptView';
import styles from './PosPage.module.css';

interface CartLine {
  productId: number;
  productName: string;
  quantity: number;
}

// STORY-040 — POS checkout screen. The cart-building/quote-live-validation
// interaction has no Sprint 7/8 precedent (PRD §2), so component shape here
// is a judgment call: a single page split into a product-search panel and a
// cart/results panel, rather than a wizard or separate route per step.
export function PosPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const canCreate = hasPermission('sales:create');

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleReceiptResponse | null>(null);

  const quoteRequestIdRef = useRef(0);

  const productsQuery = useQuery({
    queryKey: ['sales', 'productSearch', tenantId, search],
    queryFn: ({ signal }) =>
      fetchProducts(tenantId as number, { search: search || undefined, per_page: 20 }, signal),
    enabled: tenantId != null && canCreate,
  });

  // Only actually-sellable products belong in a checkout search — a
  // discontinued/inactive product shouldn't be addable to a new sale even if
  // it still matches the search term. Judgment call, see impl-notes.
  const sellableProducts: Product[] = useMemo(
    () => (productsQuery.data?.data ?? []).filter((p) => p.isActive),
    [productsQuery.data]
  );

  const cartRequestLines = useMemo(
    () => cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    [cart]
  );
  const cartSignature = useMemo(() => JSON.stringify(cartRequestLines), [cartRequestLines]);

  // Live validation (PRD §3, STORY-040): re-quote on every cart change,
  // debounced so rapid quantity typing doesn't hammer the endpoint. Trusts
  // only the quote response for prices/availability — never a client-side
  // computation from Product.currentPrice, which could be stale.
  const runQuote = useCallback(async () => {
    if (tenantId == null || cartRequestLines.length === 0) {
      quoteRequestIdRef.current += 1;
      setQuote(null);
      setQuoteError(null);
      setIsQuoting(false);
      return;
    }
    const requestId = ++quoteRequestIdRef.current;
    setIsQuoting(true);
    try {
      const result = await quoteSale(tenantId, cartRequestLines);
      if (quoteRequestIdRef.current !== requestId) return; // superseded by a newer cart change
      setQuote(result);
      setQuoteError(null);
    } catch (err) {
      if (quoteRequestIdRef.current !== requestId) return;
      setQuote(null);
      setQuoteError(err instanceof SalesApiError ? err.message : 'Could not validate cart.');
    } finally {
      if (quoteRequestIdRef.current === requestId) setIsQuoting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, cartSignature]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void runQuote();
    }, 350);
    return () => clearTimeout(handle);
  }, [runQuote]);

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutSale(tenantId as number, { lines: cartRequestLines }),
    onSuccess: (receipt) => {
      toast.success('Sale completed.');
      setCompletedSale(receipt);
      setCart([]);
      setQuote(null);
      setQuoteError(null);
    },
    onError: (err) => {
      if (err instanceof SalesApiError && err.status === 409) {
        // PRD §3 / Sprint 4 lesson: never show the raw 409 body — stock
        // genuinely changed between the last quote and this checkout attempt
        // under real concurrency. Re-run the quote so the cart reflects
        // current reality instead of the stale numbers the cashier saw.
        toast.error('Stock changed since your last check — please review your cart.');
        setQuoteError('Stock changed since your last check. The cart has been re-validated below.');
        void runQuote();
        return;
      }
      toast.error(err instanceof SalesApiError ? err.message : 'Failed to complete sale.');
    },
  });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.productId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { productId: product.productId, productName: product.name, quantity: 1 }];
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    const safeQuantity = Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: safeQuantity } : l))
    );
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function startNewSale() {
    setCompletedSale(null);
  }

  const quoteLineByProductId = useMemo(() => {
    const map = new Map<number, QuoteResponse['lines'][number]>();
    quote?.lines.forEach((l) => map.set(l.productId, l));
    return map;
  }, [quote]);

  const searchColumns: ColumnDef<Product>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (r) => r.name },
      { key: 'sku', header: 'SKU', render: (r) => r.sku ?? '—' },
      { key: 'price', header: 'Price', render: (r) => r.currentPrice.toLocaleString() },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => addToCart(r)}
          >
            + Add
          </button>
        ),
      },
    ],
    [T]
  );

  const cartColumns: ColumnDef<CartLine>[] = useMemo(
    () => [
      { key: 'productName', header: 'Product', render: (r) => r.productName },
      {
        key: 'quantity',
        header: 'Qty',
        render: (r) => (
          <input
            type="number"
            min={1}
            value={r.quantity}
            onChange={(e) => updateQuantity(r.productId, Number(e.target.value))}
            className={styles.qtyInput}
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        ),
      },
      {
        key: 'unitPrice',
        header: 'Unit Price',
        render: (r) => {
          const line = quoteLineByProductId.get(r.productId);
          return line ? line.unitPrice.toLocaleString() : '—';
        },
      },
      {
        key: 'lineTotal',
        header: 'Line Total',
        render: (r) => {
          const line = quoteLineByProductId.get(r.productId);
          return line ? line.lineTotal.toLocaleString() : '—';
        },
      },
      {
        key: 'availability',
        header: 'Availability',
        render: (r) => {
          const line = quoteLineByProductId.get(r.productId);
          if (!line) {
            return (
              <span style={{ color: T.textMuted, fontSize: 12 }}>
                {isQuoting ? 'Checking…' : '—'}
              </span>
            );
          }
          if (!line.available) {
            return (
              <span style={{ color: T.red, fontWeight: 600, fontSize: 12 }}>
                Only {line.totalOnHand} in stock
              </span>
            );
          }
          return <span style={{ color: T.green, fontWeight: 600, fontSize: 12 }}>OK</span>;
        },
      },
      {
        key: 'remove',
        header: '',
        render: (r) => (
          <button
            type="button"
            className={styles.removeBtn}
            style={{ color: T.red }}
            onClick={() => removeLine(r.productId)}
          >
            Remove
          </button>
        ),
      },
    ],
    [T, quoteLineByProductId, isQuoting]
  );

  if (!canCreate) {
    return (
      <div>
        <Topbar title="Point of Sale" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to make sales.
        </div>
      </div>
    );
  }

  if (completedSale) {
    return (
      <div>
        <Topbar title="Point of Sale" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32 }}>
          <SaleReceiptView
            receipt={completedSale}
            headerActions={
              <div
                className={styles.successBanner}
                style={{ background: T.greenLight, color: T.green }}
              >
                <span>Sale completed successfully.</span>
                <button
                  type="button"
                  className={styles.newSaleBtn}
                  style={{ background: T.indigo }}
                  onClick={startNewSale}
                >
                  New Sale
                </button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // Blocks checkout whenever the last quote is missing, stale, or reports any
  // insufficient line — never allow "Complete Sale" to fire against numbers
  // that haven't been confirmed live (PRD §3 hard requirement).
  const canCheckout =
    cart.length > 0 &&
    quote != null &&
    quote.allSufficient &&
    !isQuoting &&
    !checkoutMutation.isPending;

  return (
    <div>
      <Topbar title="Point of Sale" subtitle={tenantName ?? undefined} />

      <div className={styles.grid}>
        <div
          className={styles.panel}
          style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
        >
          <h3 className={styles.panelTitle} style={{ color: T.text }}>
            Find a product
          </h3>
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
          {productsQuery.isLoading ? (
            <Spinner size="sm" />
          ) : productsQuery.isError ? (
            <div style={{ color: T.red, fontSize: 13 }}>Couldn&apos;t load products.</div>
          ) : (
            <DataTable
              data={sellableProducts}
              columns={searchColumns}
              getRowKey={(r) => r.productId}
              pageSize={8}
              emptyMessage="No matching products."
            />
          )}
        </div>

        <div
          className={styles.panel}
          style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
        >
          <h3 className={styles.panelTitle} style={{ color: T.text }}>
            Cart
          </h3>

          {quoteError && (
            <div className={styles.errorBanner} style={{ background: T.redLight, color: T.red }}>
              {quoteError}
            </div>
          )}

          <DataTable
            data={cart}
            columns={cartColumns}
            getRowKey={(r) => r.productId}
            pageSize={10}
            emptyMessage="Cart is empty — search for a product to add it."
          />

          <div className={styles.totalsBar}>
            <div className={styles.totalsRow} style={{ color: T.textMuted }}>
              <span>Subtotal</span>
              <span>{quote ? quote.subtotal.toLocaleString() : '—'}</span>
            </div>
            <div
              className={styles.totalsRow}
              style={{ color: T.text, fontWeight: 700, fontSize: 16 }}
            >
              <span>Total</span>
              <span>{quote ? quote.total.toLocaleString() : '—'}</span>
            </div>
          </div>

          {quote && !quote.allSufficient && (
            <div className={styles.errorBanner} style={{ background: T.redLight, color: T.red }}>
              One or more items exceed available stock — remove or reduce them to complete this
              sale.
            </div>
          )}

          <button
            type="button"
            className={styles.checkoutBtn}
            style={{ background: T.indigo }}
            disabled={!canCheckout}
            onClick={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? 'Completing…' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PosPage;
