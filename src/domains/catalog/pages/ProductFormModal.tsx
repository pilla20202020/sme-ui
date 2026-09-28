import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import {
  CatalogApiError,
  PRODUCT_UNITS,
  createCategory,
  createProduct,
  updateProduct,
  updateProductPrice,
  type Category,
  type Product,
  type ProductUnit,
} from '../api/catalogApi';
import styles from './ProductFormModal.module.css';

interface ProductFormModalProps {
  tenantId: number;
  categories: Category[];
  /** null => create mode. A Product => edit mode, pre-filled. */
  product: Product | null;
  canUpdatePrice: boolean;
  /** Gates the inline "+ New category…" quick-create — POST /categories requires catalog:create
   * independent of whatever permission opened this modal (edit mode only needs catalog:update). */
  canCreateCategory: boolean;
  onClose: () => void;
}

const inputStyleBase = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  fontSize: 13,
  boxSizing: 'border-box' as const,
  fontFamily: "'DM Sans', sans-serif",
};

export function ProductFormModal({
  tenantId,
  categories,
  product,
  canUpdatePrice,
  canCreateCategory,
  onClose,
}: ProductFormModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();
  const isEdit = product != null;

  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? 'tablet');
  const [categoryId, setCategoryId] = useState<number | ''>(product?.categoryId ?? '');
  const [reorderThreshold, setReorderThreshold] = useState(
    product?.reorderThreshold != null ? String(product.reorderThreshold) : ''
  );
  const [currentPrice, setCurrentPrice] = useState(
    product?.currentPrice != null ? String(product.currentPrice) : ''
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [priceEditing, setPriceEditing] = useState(false);
  const [priceDraft, setPriceDraft] = useState(
    product?.currentPrice != null ? String(product.currentPrice) : ''
  );

  const invalidateProducts = () =>
    queryClient.invalidateQueries({ queryKey: ['catalog', 'products', tenantId] });
  const invalidateCategories = () =>
    queryClient.invalidateQueries({ queryKey: ['catalog', 'categories', tenantId] });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryName: string) => createCategory(tenantId, categoryName),
    onSuccess: (created) => {
      toast.success(`Category "${created.name}" created.`);
      void invalidateCategories();
      setCategoryId(created.categoryId);
      setShowNewCategory(false);
      setNewCategoryName('');
    },
    onError: (err) => {
      toast.error(err instanceof CatalogApiError ? err.message : 'Failed to create category.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        unit,
        categoryId: categoryId === '' ? undefined : categoryId,
        reorderThreshold: reorderThreshold === '' ? undefined : Number(reorderThreshold),
      };
      if (isEdit) {
        return updateProduct(tenantId, product.productId, { ...payload, isActive });
      }
      return createProduct(tenantId, { ...payload, currentPrice: Number(currentPrice) });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated.' : 'Product created.');
      void invalidateProducts();
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof CatalogApiError ? err.message : 'Failed to save product.');
    },
  });

  const priceMutation = useMutation({
    mutationFn: () =>
      updateProductPrice(tenantId, (product as Product).productId, Number(priceDraft)),
    onSuccess: () => {
      toast.success('Price updated. A price history entry was recorded.');
      void invalidateProducts();
      setPriceEditing(false);
    },
    onError: (err) => {
      toast.error(err instanceof CatalogApiError ? err.message : 'Failed to update price.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  function handleCreateCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    createCategoryMutation.mutate(trimmed);
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
          {isEdit ? 'Edit Product' : 'Add Product'}
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
          Name *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            maxLength={255}
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          SKU
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            style={inputStyle}
            maxLength={100}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label} style={{ color: T.textMuted, flex: 1 }}>
            Unit *
            <select
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              style={inputStyle}
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label} style={{ color: T.textMuted, flex: 1 }}>
            Reorder threshold
            <input
              type="number"
              min={0}
              value={reorderThreshold}
              onChange={(e) => setReorderThreshold(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Category
          {!showNewCategory || !canCreateCategory ? (
            <select
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowNewCategory(true);
                  return;
                }
                setCategoryId(e.target.value === '' ? '' : Number(e.target.value));
              }}
              style={inputStyle}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
              {canCreateCategory && <option value="__new__">+ New category…</option>}
            </select>
          ) : (
            <div className={styles.row}>
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                style={{ ...inputStyle, flex: 1 }}
                maxLength={150}
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ color: T.indigo, borderColor: T.indigo }}
                disabled={createCategoryMutation.isPending}
                onClick={handleCreateCategory}
              >
                {createCategoryMutation.isPending ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ color: T.textMuted, borderColor: T.border }}
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName('');
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </label>

        {!isEdit && (
          <label className={styles.label} style={{ color: T.textMuted }}>
            Price *
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              style={inputStyle}
            />
          </label>
        )}

        {isEdit && (
          <label className={styles.checkboxLabel} style={{ color: T.textMuted }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        )}

        {isEdit && canUpdatePrice && (
          <div
            className={styles.priceBox}
            style={{ border: `1px solid ${T.border}`, background: T.bgAlt }}
          >
            <div className={styles.priceBoxHeader}>
              <span style={{ color: T.textMuted, fontSize: 12, fontWeight: 600 }}>
                Current price: {(product as Product).currentPrice.toLocaleString()}
              </span>
              {!priceEditing && (
                <button
                  type="button"
                  className={styles.linkBtn}
                  style={{ color: T.indigo }}
                  onClick={() => {
                    setPriceDraft(String((product as Product).currentPrice));
                    setPriceEditing(true);
                  }}
                >
                  Update Price
                </button>
              )}
            </div>
            {priceEditing && (
              <div className={styles.row} style={{ marginTop: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={priceDraft}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  title="Changing this creates a price history entry"
                />
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  style={{ color: T.indigo, borderColor: T.indigo }}
                  disabled={priceMutation.isPending}
                  onClick={() => priceMutation.mutate()}
                >
                  {priceMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  style={{ color: T.textMuted, borderColor: T.border }}
                  onClick={() => setPriceEditing(false)}
                >
                  Cancel
                </button>
              </div>
            )}
            <div style={{ color: T.textMuted, fontSize: 11, marginTop: 6 }}>
              Changing the price creates a price history entry — it is saved separately from the
              fields above.
            </div>
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
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
