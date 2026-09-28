import { useState } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';
import { ModalOverlay } from '@/layouts';
import { ActionBtn } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils';
import type { Enrollment } from '@/domains/enrollments/types';

interface NotesModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onAddNote: (enrollment: Enrollment, note: string) => void;
}

export function NotesModal({ enrollment, onClose, onAddNote }: NotesModalProps) {
  const { T } = useTheme();
  const [text, setText] = useState('');

  function handleAdd() {
    if (!text.trim()) return;
    onAddNote(enrollment, text.trim());
    setText('');
  }

  return (
    <ModalOverlay onClose={onClose} width={520}>
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>Notes</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
          {enrollment.name} · {enrollment.policyId}
        </div>

        {/* Existing notes */}
        <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 20 }}>
          {!enrollment.notes?.length && (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: 24 }}>
              No notes yet.
            </div>
          )}
          {enrollment.notes?.map((note, i) => (
            <div
              key={i}
              style={{
                background: T.bgAlt,
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 10,
                border: '1px solid ' + T.border,
              }}
            >
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
                {note.author} · {formatDate(note.date)}
              </div>
              <div style={{ fontSize: 13, color: T.text }}>{note.text}</div>
            </div>
          ))}
        </div>

        {/* Add note */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          style={{
            width: '100%',
            borderRadius: 8,
            border: '1px solid ' + T.border,
            padding: '8px 12px',
            fontSize: 13,
            color: T.text,
            background: T.bg,
            resize: 'vertical',
            boxSizing: 'border-box',
            marginBottom: 14,
          }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ActionBtn label="Close" color={T.slate} onClick={onClose} />
          <ActionBtn
            label="Add Note"
            color={T.indigo}
            onClick={handleAdd}
            disabled={!text.trim()}
          />
        </div>
      </div>
    </ModalOverlay>
  );
}
