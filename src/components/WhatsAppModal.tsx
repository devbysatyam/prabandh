import { useEffect, useRef, type FC } from 'react';
import type { Plan } from '../schemas';
import { Icon } from './Icon';
import { generateFamilyWhatsappUpdate } from '../engine/whatsapp';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface WhatsAppModalProps {
  plan: Plan;
  today: string;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep Tab / Shift+Tab focus cycling inside `container`. */
function trapTab(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/** Accessible modal dialog (focus trap, Escape to close) with a ready-to-send family update. */
export const WhatsAppModal: FC<WhatsAppModalProps> = ({ plan, today, onClose }) => {
  const { copiedKey, copy } = useCopyToClipboard();
  const copied = copiedKey !== null;
  const message = generateFamilyWhatsappUpdate(plan, today);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog on open and restore it to the opener on close (APG dialog pattern)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      opener?.focus?.();
    };
  }, []);

  // Escape closes; Tab is trapped inside the dialog (native listener keeps the dialog element non-interactive for a11y linting)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') trapTab(e, dialog);
    }
    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleCopy() {
    copy(message);
  }

  function handleOpenWhatsApp() {
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div aria-hidden="true" className="absolute inset-0" onMouseDown={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-dialog-title"
        aria-describedby="whatsapp-dialog-desc"
        className="card relative w-full max-w-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Icon name="whatsapp" className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2
              id="whatsapp-dialog-title"
              className="font-bold text-base text-stone-900 dark:text-stone-100"
            >
              Family WhatsApp Broadcast
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-semibold"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <p id="whatsapp-dialog-desc" className="text-xs text-stone-600 dark:text-stone-400">
          A beautifully formatted update summarizing your budget status, confirmed RSVPs, and
          pending milestones, ready to post to your family WhatsApp group.
        </p>

        <div
          tabIndex={0}
          role="region"
          aria-label="Message preview"
          className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 font-mono text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line max-h-72 overflow-y-auto border border-stone-200/80 dark:border-stone-800 leading-relaxed"
        >
          {message}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
          <button type="button" onClick={handleCopy} className="btn-secondary text-xs">
            {copied ? '✓ Copied!' : 'Copy Text'}
          </button>
          <span role="status" aria-live="polite" className="sr-only">
            {copied ? 'Message copied to clipboard' : ''}
          </span>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="btn-primary text-xs bg-emerald-700 hover:bg-emerald-800 border-none flex items-center gap-1.5"
          >
            <Icon name="whatsapp" className="w-4 h-4 text-white" />
            Open in WhatsApp<span className="sr-only"> (opens in new tab)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
