import React from 'react';
import { X, AlertTriangle, Trash2, HelpCircle, Info } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger" // 'danger', 'warning', 'info'
}) {
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = {
    danger: {
      icon: Trash2,
      color: 'text-occupied',
      bg: 'bg-occupied/10',
      border: 'border-occupied/20',
      btn: 'bg-occupied hover:opacity-90',
      glow: 'shadow-occupied/20'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-pending',
      bg: 'bg-pending/10',
      border: 'border-pending/20',
      btn: 'bg-pending hover:opacity-90',
      glow: 'shadow-pending/20'
    },
    info: {
      icon: Info,
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      btn: 'bg-accent hover:opacity-90',
      glow: 'shadow-accent/20'
    }
  };

  const s = styles[type] || styles.info;
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className={`relative w-full max-w-sm glass rounded-2xl border border-border shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200`}>
        <div className={`w-12 h-12 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 ${s.color}`} />
        </div>

        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-border text-[var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-elevated transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 h-11 text-white rounded-xl text-sm font-bold shadow-lg ${s.btn} ${s.glow} transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
