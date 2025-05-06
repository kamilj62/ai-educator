import React from 'react';

interface ErrorDisplayProps {
<<<<<<< HEAD
  error: string | { message?: string; [key: string]: any } | null;
=======
  error: string | null;
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  // Determine the error message to display
  let errorMessage = typeof error === 'string' ? error : error.message || String(error);

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <div style={{ color: 'red', margin: '1rem 0' }}>
      <strong>Error:</strong> {errorMessage}
      {onClose && (
        <button onClick={onClose} style={{ marginLeft: '1rem' }}>
          Close
        </button>
      )}
=======
    <div className={`rounded-lg border p-4 mb-4 ${getErrorColor(error.type ?? '')}`}>
=======
    <div className={`rounded-lg border p-4 mb-4 ${getErrorColor(error ?? '')}`}>
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {getErrorTitle(error ?? '')}
          </h3>
          <p className="mb-2">{error}</p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close error message"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
    </div>
  );
};

export default ErrorDisplay;
