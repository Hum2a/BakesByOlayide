import React from 'react';
import '../styles/Modal.css';

const MessageModal = ({
  isOpen,
  onClose,
  title = 'Notice',
  message,
  variant = 'info',
}) => {
  if (!isOpen || message == null) return null;

  return (
    <div
      className="message-modal-overlay modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-modal-title"
      onClick={onClose}
    >
      <div
        className={`modal-content message-modal message-modal--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="modal-header message-modal-header">
          <h2 id="message-modal-title">{title}</h2>
        </div>
        <div className="modal-body message-modal-body">
          <p className="message-modal-text">{message}</p>
        </div>
        <div className="message-modal-footer">
          <button type="button" className="submit-button message-modal-ok" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
