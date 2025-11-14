import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'medium', message = 'Chargement...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
