import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmDialog = ({ 
  isOpen, 
  title = 'Confirmation', 
  message, 
  confirmText = 'Confirmer', 
  cancelText = 'Annuler',
  confirmButtonClass = 'btn-confirm',
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-footer">
          <button 
            className="btn-cancel-confirm" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn-action ${confirmButtonClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
