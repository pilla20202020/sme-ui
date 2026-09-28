import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import { SuppliersApiError, createSupplier } from '../api/suppliersApi';
import styles from './SupplierFormModal.module.css';

interface SupplierFormModalProps {
  tenantId: number;
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

// STORY-046 — create-only form (PRD §4: no edit/deactivate endpoint exists
// for suppliers, so this modal never gets an "edit mode" like catalog's
// ProductFormModal does).
export function SupplierFormModal({ tenantId, onClose }: SupplierFormModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [address, setAddress] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createSupplier(tenantId, {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        address: address.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Supplier created.');
      void queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof SuppliersApiError ? err.message : 'Failed to create supplier.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  const inputStyle = {
    ...inputStyleBase,
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
  };

  return (
    <Modal onClose={onClose} width={420}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Add Supplier
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
            minLength={2}
            maxLength={255}
            autoFocus
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Contact Person
          <input
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            style={inputStyle}
            maxLength={255}
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            maxLength={50}
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            maxLength={255}
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Payment Terms
          <input
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            style={inputStyle}
            maxLength={255}
            placeholder="e.g. Net 30"
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={inputStyle}
            maxLength={500}
          />
        </label>

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
            {createMutation.isPending ? 'Creating…' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SupplierFormModal;
