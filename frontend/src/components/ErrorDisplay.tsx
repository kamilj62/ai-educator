import React from 'react';

interface ErrorDisplayProps {
  error: string | { message?: string; [key: string]: any } | null;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  // Determine the error message to display
  let errorMessage = typeof error === 'string' ? error : error.message || String(error);

  return (
    <div style={{ color: 'red', margin: '1rem 0' }}>
      <strong>Error:</strong> {errorMessage}
      {onClose && (
        <button onClick={onClose} style={{ marginLeft: '1rem' }}>
          Close
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
