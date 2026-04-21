import React, { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function showToast({ type = 'success', title = '', text = '', duration = 2600 }) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast = { id, type, title, text };
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }

  const value = useMemo(() => ({
    showToast,
    removeToast
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="global-toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`floating-toast ${toast.type}`}>
            <div className="floating-toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '!' : '×'}
            </div>
            <div style={{ flex: 1 }}>
              <strong>{toast.title}</strong>
              <div>{toast.text}</div>
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
