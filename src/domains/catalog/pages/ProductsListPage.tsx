import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchCategories, fetchProducts, type Category, type Product } from '../api/catalogApi';
import { ProductFormModal } from './ProductFormModal';
import { ProductBatchesModal } from './ProductBatchesModal';
import styles from './ProductsListPage.module.css';

type ModalState =
  | { kind: 'create' }
  | { kind: 'edit'; product: Product }
  | { kind: 'batches'; productId: number; productName: string }
  | null;

export function ProductsListPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [modal, setModal] = useState<ModalState>(null);

  const canCreate = hasPermission('catalog:create');
  const canUpdate = hasPermission('catalog:update');
  const canRead = hasPermission('catalog:read');

  const categoriesQuery = useQuery({
    queryKey: ['catalog', 'categories', tenantId],
    queryFn: ({ signal }) => fetchCategories(tenantId as number, signal),
    enabled: tenantId != null && canRead,
  });
  const categoriesData = categoriesQuery.data?.data;
  const categories: Category[] = useMemo(() => categoriesData ?? [], [categoriesData]);
  const categoryById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => map.set(c.categoryId, c.name));
    return map;
  }, [categories]);

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', tenantId, search, categoryId],
    queryFn: ({ signal }) =>
      fetchProducts(
        tenantId as number,
        { search: search || undefined, categoryId: categoryId === '' ? undefined : categoryId },
        signal
      ),
    enabled: tenantId != null && canRead,
  });

  const columns: ColumnDef<Product>[] = useMemo(() => {
    const cols: ColumnDef<Product>[] = [
      { key: 'name', header: 'Name', render: (r) => r.name },
      { key: 'sku', header: 'SKU', render: (r) => r.sku ?? '—' },
      {
        key: 'category',
        header: 'Category',
        render: (r) => (r.categoryId != null ? (categoryById.get(r.categoryId) ?? '—') : '—'),
      },
      { key: 'unit', header: 'Unit', render: (r) => r.unit },
      { key: 'currentPrice', header: 'Price', render: (r) => r.currentPrice.toLocaleString() },
      {
        key: 'reorderThreshold',
        header: 'Reorder Threshold',
        render: (r) => r.reorderThreshold ?? '—',
      },
      {
        key: 'isActive',
        header: 'Status',
        render: (r) => (
          <span style={{ color: r.isActive ? T.green : T.textMuted, fontWeight: 600 }}>
            {r.isActive ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ];

    cols.push({
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: 10 }}>
          {canUpdate && (
            <button
              type="button"
              className={styles.rowActionBtn}
              style={{ color: T.indigo }}
              onClick={() => setModal({ kind: 'edit', product: r })}
            >
              Edit
            </button>
          )}
          {canRead && (
            <button
              type="button"
              className={styles.rowActionBtn}
              style={{ color: T.blue }}
              onClick={() =>
                setModal({ kind: 'batches', productId: r.productId, productName: r.name })
              }
            >
              View Batches
            </button>
          )}
        </div>
      ),
    });

    return cols;
  }, [categoryById, canUpdate, canRead, T]);

  if (!canRead) {
    return (
      <div>
        <Topbar title="Catalog" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view the catalog.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Catalog" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className={styles.categorySelect}
            style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setModal({ kind: 'create' })}
          >
            + Add Product
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {productsQuery.isLoading ? (
          <Spinner size="sm" />
        ) : productsQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load products.</div>
        ) : (
          <DataTable
            data={productsQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.productId}
            emptyMessage="No products found."
          />
        )}
      </div>

      {modal?.kind === 'create' && tenantId != null && (
        <ProductFormModal
          tenantId={tenantId}
          categories={categories}
          product={null}
          canUpdatePrice={canUpdate}
          canCreateCategory={canCreate}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'edit' && tenantId != null && (
        <ProductFormModal
          tenantId={tenantId}
          categories={categories}
          product={modal.product}
          canUpdatePrice={canUpdate}
          canCreateCategory={canCreate}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'batches' && tenantId != null && (
        <ProductBatchesModal
          tenantId={tenantId}
          productId={modal.productId}
          productName={modal.productName}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default ProductsListPage;
