import { create } from 'zustand';

export type DialogMode = 'confirm' | 'notify';
export type DialogResult = boolean | 'secondary';

export interface DialogRequest {
  mode: DialogMode;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  secondaryLabel?: string;
  destructive?: boolean;
  resolve: (result: DialogResult) => void;
}

interface DialogState {
  current: DialogRequest | null;
  openConfirm: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    secondaryLabel?: string;
    destructive?: boolean;
  }) => Promise<DialogResult>;
  openNotify: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<void>;
  settle: (result: DialogResult) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  current: null,

  openConfirm: ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', secondaryLabel, destructive }) =>
    new Promise<DialogResult>((resolve) => {
      set({
        current: {
          mode: 'confirm',
          title,
          message,
          confirmLabel,
          cancelLabel,
          secondaryLabel,
          destructive,
          resolve,
        },
      });
    }),

  openNotify: ({ title, message, confirmLabel = 'OK' }) =>
    new Promise<void>((resolve) => {
      set({
        current: {
          mode: 'notify',
          title,
          message,
          confirmLabel,
          cancelLabel: '',
          resolve: () => resolve(),
        },
      });
    }),

  settle: (result) => {
    const { current } = get();
    if (!current) return;
    set({ current: null });
    current.resolve(result);
  },
}));
