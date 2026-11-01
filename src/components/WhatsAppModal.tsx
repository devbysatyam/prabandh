import { useState, type FC } from 'react';
import type { Plan } from '../schemas';
import { Icon } from './Icon';
import { generateFamilyWhatsappUpdate } from '../engine/whatsapp';

interface WhatsAppModalProps {
  plan: Plan;
  today: string;
  onClose: () => void;
}

export const WhatsAppModal: FC<WhatsAppModalProps> = ({ plan, today, onClose }) => {
  const [copied, setCopied] = useState(false);
  const message = generateFamilyWhatsappUpdate(plan, today);

  function handleCopy() {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleOpenWhatsApp() {
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Icon name="whatsapp" className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              Family WhatsApp Broadcast
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          A beautifully formatted update summarizing your budget status, confirmed RSVPs, and pending milestones, ready to post to your family WhatsApp group.
        </p>

        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 font-mono text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line max-h-72 overflow-y-auto border border-stone-200/80 dark:border-stone-800 leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
          <button type="button" onClick={handleCopy} className="btn-secondary text-xs">
            {copied ? '✓ Copied!' : 'Copy Text'}
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 border-none flex items-center gap-1.5"
          >
            <Icon name="whatsapp" className="w-4 h-4 text-white" />
            Open in WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
