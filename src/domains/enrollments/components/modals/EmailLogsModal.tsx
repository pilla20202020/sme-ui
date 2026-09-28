import { useState } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';
import { ModalOverlay } from '@/layouts';
import { ActionBtn, StatusBadge } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils';
import type { Enrollment, EmailLog } from '@/domains/enrollments/types';

interface EmailLogsModalProps {
  enrollment: Enrollment;
  onClose: () => void;
}

const TABS = ['All', 'Delivered', 'Failed', 'Bounced'];

export function EmailLogsModal({ enrollment, onClose }: EmailLogsModalProps) {
  const { T } = useTheme();
  const [tab, setTab] = useState('All');
  const logs = enrollment.emailLogs ?? [];
  const filtered = tab === 'All' ? logs : logs.filter((e: EmailLog) => e.direction === tab);

  return (
    <ModalOverlay onClose={onClose} width={640}>
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>
          ✉ Email Log
        </div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
          {enrollment.name} · {enrollment.policyId}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: tab === t ? T.indigo : T.bgHover,
                color: tab === t ? '#fff' : T.textSub,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          {!filtered.length && (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: 28 }}>
              No emails found.
            </div>
          )}
          {filtered.map((log: EmailLog, i: number) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                marginBottom: 8,
                background: T.bgAlt,
                border: '1px solid ' + T.border,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.subject}</span>
                <span style={{ fontSize: 11, color: T.textMuted }}>{formatDate(log.dateSent)}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{log.recipients}</div>
              {log.status && <StatusBadge status={log.status} />}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <ActionBtn label="Close" color={T.slate} onClick={onClose} />
        </div>
      </div>
    </ModalOverlay>
  );
}
