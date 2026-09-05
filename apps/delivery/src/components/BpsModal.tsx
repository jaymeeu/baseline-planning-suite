import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export interface BpsModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  danger?: boolean;
}

export function BpsModal({
  open,
  title,
  onClose,
  children,
  footer,
  danger = false,
}: BpsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`bps-modal${danger ? ' bps-modal--danger' : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div
        className="bps-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bps-modal__header">
          <h3 className="bps-section-title" id={titleId}>
            {title}
          </h3>
          <button
            type="button"
            className="bps-btn bps-btn--ghost bps-btn--sm"
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="bps-modal__body">{children}</div>
        <footer className="bps-modal__footer">{footer}</footer>
      </div>
    </dialog>
  );
}

/** Submit the modal primary button when Enter is pressed in a field. */
export function submitModalOnEnter(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const primary = event.currentTarget
    .closest('.bps-modal__panel')
    ?.querySelector(
      '.bps-modal__footer .bps-btn--primary, .bps-modal__footer .bps-btn--danger',
    ) as HTMLButtonElement | null;
  primary?.click();
}

export function ModalError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="bps-field__hint bps-field__hint--error mt-2" role="alert">
      {message}
    </p>
  );
}
