import { useReducer, useCallback } from 'react';
import type { Enrollment } from '@/domains/enrollments/types';

export type ModalKey =
  | 'askQuestion'
  | 'approve'
  | 'editPlan'
  | 'reject'
  | 'notes'
  | 'emailLogs'
  | 'activate'
  | 'revert'
  | 'reminder'
  | 'resendSignature'
  | 'medicalDetails';

type ModalState = Record<ModalKey, Enrollment | null>;

type ModalAction =
  | { type: 'open'; key: ModalKey; enrollment: Enrollment }
  | { type: 'close'; key: ModalKey };

const INITIAL_STATE: ModalState = {
  askQuestion: null,
  approve: null,
  editPlan: null,
  reject: null,
  notes: null,
  emailLogs: null,
  activate: null,
  revert: null,
  reminder: null,
  resendSignature: null,
  medicalDetails: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  if (action.type === 'open') return { ...state, [action.key]: action.enrollment };
  return { ...state, [action.key]: null };
}

export function useEnrollmentModals() {
  const [state, dispatch] = useReducer(modalReducer, INITIAL_STATE);

  const open = useCallback((key: ModalKey, enrollment: Enrollment) => {
    dispatch({ type: 'open', key, enrollment });
  }, []);

  const close = useCallback((key: ModalKey) => {
    dispatch({ type: 'close', key });
  }, []);

  return { ...state, open, close };
}

export type EnrollmentModalsHandle = ReturnType<typeof useEnrollmentModals>;
