import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card border border-border rounded-2xl max-w-[640px] w-full max-h-[85vh] overflow-y-auto animate-[slideUp_0.25s_ease]">
        <div className="flex items-start justify-between p-7 pb-0">
          <h2 className="text-xl font-bold font-mono">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary hover:bg-border p-1 rounded-md transition-colors bg-transparent border-none cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-7">{children}</div>
        {footer && (
          <div className="px-7 py-4 border-t border-border flex items-center justify-between">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
