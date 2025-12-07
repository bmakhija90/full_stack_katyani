import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : undefined;

  return (
    <div className="loading-spinner text-center py-5">
      <Spinner animation="border" role="status" size={spinnerSize}>
        <span className="visually-hidden">{message}</span>
      </Spinner>
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;