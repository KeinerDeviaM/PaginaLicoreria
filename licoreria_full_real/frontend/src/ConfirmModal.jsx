import React from 'react';

export default function ConfirmModal({
  open,
  title = 'Confirmar acción',
  message = '¿Deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="confirm-backdrop">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="stack" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn ${danger ? 'btn-wine' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
