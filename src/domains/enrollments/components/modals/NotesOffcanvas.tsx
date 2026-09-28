import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineX,
  HiOutlineAnnotation,
  HiOutlinePlus,
  HiOutlineChevronDown,
} from 'react-icons/hi';
import { formatDateTime } from '@/shared/utils';
import type { Enrollment } from '@/domains/enrollments/types';
import styles from './NotesOffcanvas.module.css';

interface NotesOffcanvasProps {
  enrollment: Enrollment;
  notes?: { id?: string; text: string; author: string; date: string }[];
  isLoading?: boolean;
  isPending?: boolean;
  onClose: () => void;
  onAddNote: (enrollment: Enrollment, note: string) => void;
}

export function NotesOffcanvas({
  enrollment,
  notes: notesProp,
  isLoading = false,
  isPending = false,
  onClose,
  onAddNote,
}: NotesOffcanvasProps) {
  const [text, setText] = useState('');
  const [showScrollDown, setShowScrollDown] = useState(false);
  const notesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const el = notesSectionRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight > el.clientHeight);
  }, [notesProp]);

  function handleScroll() {
    const el = notesSectionRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 40);
  }

  function scrollToBottom() {
    notesSectionRef.current?.scrollTo({
      top: notesSectionRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }

  function handleAdd() {
    if (!text.trim()) return;
    onAddNote(enrollment, text.trim());
    setText('');
  }

  const notes = notesProp ?? enrollment.notes ?? [];

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineAnnotation />
            </div>
            <div>
              <div className={styles.headerTitle}>Notes</div>
              <div className={styles.headerSubtitle}>
                {enrollment.name} · {enrollment.policyId}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <HiOutlineX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Scrollable notes list */}
          <div className={styles.notesSection} ref={notesSectionRef} onScroll={handleScroll}>
            <div className={styles.sectionLabel}>
              Previous Notes {!isLoading && notes.length > 0 && `(${notes.length})`}
            </div>
            {isLoading ? (
              <div className={styles.notesList}>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className={styles.noteCard}>
                    <div className={styles.noteMeta}>
                      <div className={styles.noteAuthorwrapper}>
                        <div
                          className={styles.noteAuthorAvatar}
                          style={{ background: 'var(--color-border)' }}
                        />
                        <div className={styles.skeletonBar} style={{ width: 70 }} />
                      </div>
                      <div className={styles.skeletonBar} style={{ width: 60 }} />
                    </div>
                    <div className={styles.skeletonBar} style={{ width: '100%', marginTop: 8 }} />
                    <div className={styles.skeletonBar} style={{ width: '80%', marginTop: 6 }} />
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className={styles.emptyState}>
                <HiOutlineAnnotation />
                No notes yet. Add the first one below.
              </div>
            ) : (
              <div className={styles.notesList}>
                {notes.map((note, i) => (
                  <div key={i} className={styles.noteCard}>
                    <div className={styles.noteMeta}>
                      <div className={styles.noteAuthorwrapper}>
                        <div className={styles.noteAuthorAvatar}>
                          {note.author.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.noteAuthor}>{note.author}</span>
                      </div>
                      <span className={styles.noteDate}>{formatDateTime(note.date)}</span>
                    </div>
                    <div className={styles.noteText}>{note.text}</div>
                  </div>
                ))}
              </div>
            )}
            {showScrollDown && (
              <div className={styles.scrollBtnWrapper}>
                <button
                  className={styles.scrollDownBtn}
                  onClick={scrollToBottom}
                  aria-label="Scroll to bottom"
                >
                  <HiOutlineChevronDown />
                </button>
              </div>
            )}
          </div>

          {/* Pinned add-note section */}
          <div className={styles.addSection}>
            <div className={styles.sectionLabel}>Add Note</div>
            <div className={styles.textareaWrapper}>
              <div className={styles.textareaHeader}>
                <HiOutlinePlus />
                New Note
              </div>
              <textarea
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Write your note here..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={!text.trim() || isPending}
          >
            {isPending ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>
    </>
  );
}
