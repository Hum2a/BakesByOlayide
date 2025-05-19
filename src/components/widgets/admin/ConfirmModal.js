import React from 'react';
import '../../styles/CakeManagement.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="cakemanagement-modal-overlay">
      <div className="cakemanagement-modal">
        <h3>{title || 'Are you sure?'}</h3>
        <p>{message}</p>
        <div className="cakemanagement-modal-actions">
          <button className="cakemanagement-save-btn" onClick={onConfirm}>Yes</button>
          <button className="cakemanagement-cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 