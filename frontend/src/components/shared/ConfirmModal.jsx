import React from 'react';
import { X, AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

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

  const themes = {
    danger: {
      icon: <Trash2 className="w-6 h-6 text-status-occupied" />,
      bg: "bg-status-occupied/10",
      btn: "bg-status-occupied hover:opacity-90",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      bg: "bg-amber-400/10",
      btn: "bg-amber-400 hover:opacity-90 text-black",
    },
    info: {
      icon: <HelpCircle className="w-6 h-6 text-accent" />,
      bg: "bg-accent/10",
      btn: "bg-accent hover:opacity-90",
    }
  };

  const theme = themes[type] || themes.info;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 ${theme.bg} rounded-full flex items-center justify-center mb-6`}>
            {theme.icon}
          </div>
          
          <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            {message}
          </p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={onClose}
              className="flex-grow h-11 border border-bg-border text-text-secondary rounded-xl text-sm font-medium hover:bg-bg-elevated transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-grow h-11 ${theme.btn} text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-black/20`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
