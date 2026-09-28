import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import { BranchesApiError, createBranch } from '../api/branchesApi';
import styles from './BranchFormModal.module.css';

interface BranchFormModalProps {
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

// STORY-042 — create-only form (PRD §3/§7: no edit/deactivate endpoint
// exists for branches, so this modal never gets an "edit mode" like
// catalog's ProductFormModal does).
export function BranchFormModal({ tenantId, onClose }: BranchFormModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createBranch(tenantId, {
        name: name.trim(),
        address: address.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Branch created.');
      void queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof BranchesApiError ? err.message : 'Failed to create branch.');
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
          Add Branch
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
            {createMutation.isPending ? 'Creating…' : 'Create Branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default BranchFormModal;
