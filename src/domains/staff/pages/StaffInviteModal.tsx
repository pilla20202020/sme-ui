import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import { Modal } from '@/shared/components/ui';
import {
  StaffApiError,
  TENANT_ASSIGNABLE_ROLES,
  inviteStaff,
  type InvitedStaffMember,
  type TenantAssignableRole,
} from '../api/staffApi';
import styles from './StaffInviteModal.module.css';

interface StaffInviteModalProps {
  tenantId: number;
  onClose: () => void;
  /** Lets the list page remember this user's role locally — the list
   * endpoint never returns roleName (see staffApi.ts's GOTCHA comment), so
   * this is the only way a freshly invited user's role is ever visible. */
  onInvited: (user: InvitedStaffMember) => void;
}

const inputStyleBase = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  fontSize: 13,
  boxSizing: 'border-box' as const,
  fontFamily: "'DM Sans', sans-serif",
};

// STORY-043 — invite form. No invite-token/email flow exists in this
// codebase (a documented, intentional MVP gap — send_email is a logging
// stub, see InviteUserDto's own comment) — the inviter sets a real
// password directly and is expected to communicate it out of band. The
// inline note below is the backend's actual design, not a shortcut.
export function StaffInviteModal({ tenantId, onClose, onInvited }: StaffInviteModalProps) {
  const { T } = useTheme();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleName, setRoleName] = useState<TenantAssignableRole>('cashier');
  const [password, setPassword] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteStaff(tenantId, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        roleName,
        password,
      }),
    onSuccess: (invited) => {
      toast.success(`${invited.firstName} ${invited.lastName} invited as ${invited.roleName}.`);
      onInvited(invited);
      void queryClient.invalidateQueries({ queryKey: ['staff', tenantId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof StaffApiError ? err.message : 'Failed to invite staff member.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    inviteMutation.mutate();
  }

  const inputStyle = {
    ...inputStyleBase,
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
  };

  return (
    <Modal onClose={onClose} width={460}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{ color: T.text }}>
          Invite Staff
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
          Email *
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            maxLength={255}
            autoFocus
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label} style={{ color: T.textMuted, flex: 1 }}>
            First name *
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={inputStyle}
              maxLength={100}
            />
          </label>
          <label className={styles.label} style={{ color: T.textMuted, flex: 1 }}>
            Last name *
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
              maxLength={100}
            />
          </label>
        </div>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            maxLength={50}
          />
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Role *
          <select
            required
            value={roleName}
            onChange={(e) => setRoleName(e.target.value as TenantAssignableRole)}
            style={inputStyle}
          >
            {/* `admin` is never in TENANT_ASSIGNABLE_ROLES and must never be
                added here — SSO-only by design (PRD §2). */}
            {TENANT_ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label} style={{ color: T.textMuted }}>
          Password *
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            minLength={8}
            maxLength={255}
            autoComplete="new-password"
          />
        </label>
        <div className={styles.note} style={{ background: T.bgAlt, color: T.textMuted }}>
          There is no email/invite-link flow yet — this password is set directly and won&apos;t be
          emailed anywhere. You&apos;ll need to share it with {firstName || 'the new staff member'}{' '}
          yourself (phone call, in person, etc.) so they can log in.
        </div>

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
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? 'Inviting…' : 'Invite Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default StaffInviteModal;
