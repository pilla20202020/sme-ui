import { create } from 'zustand';
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
  | 'resendSignature';

type ModalState = Record<ModalKey, Enrollment | null>;

interface EnrollmentStore extends ModalState {
  openModal: (key: ModalKey, enrollment: Enrollment) => void;
  closeModal: (key: ModalKey) => void;
  closeAllModals: () => void;
}

const INITIAL_MODAL_STATE: ModalState = {
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
};

export const useEnrollmentStore = create<EnrollmentStore>((set) => ({
  ...INITIAL_MODAL_STATE,
  openModal: (key, enrollment) => set({ [key]: enrollment }),
  closeModal: (key) => set({ [key]: null }),
  closeAllModals: () => set({ ...INITIAL_MODAL_STATE }),
}));
