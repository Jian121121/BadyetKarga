import { useDialogStore } from '../../store/dialogStore';

/** Confirm with designed AppDialog (works on web + native). */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  options?: { destructive?: boolean }
) {
  void useDialogStore
    .getState()
    .openConfirm({
      title,
      message,
      confirmLabel,
      destructive: options?.destructive,
    })
    .then((ok) => {
      if (ok) onConfirm();
    });
}

/** Info / success toast-style dialog with OK. */
export function notify(title: string, message: string, onDone?: () => void) {
  void useDialogStore
    .getState()
    .openNotify({ title, message })
    .then(() => {
      onDone?.();
    });
}
