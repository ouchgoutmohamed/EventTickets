import React from 'react';
import { Modal as BootstrapModal } from 'react-bootstrap';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <BootstrapModal show={isOpen} onHide={onClose} centered>
      <BootstrapModal.Header closeButton>
        <BootstrapModal.Title>{title}</BootstrapModal.Title>
      </BootstrapModal.Header>
      <BootstrapModal.Body>
        {children}
      </BootstrapModal.Body>
      {footer && (
        <BootstrapModal.Footer>
          {footer}
        </BootstrapModal.Footer>
      )}
    </BootstrapModal>
  );
};

export default Modal;
