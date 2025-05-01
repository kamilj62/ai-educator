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
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {getErrorTitle(error.type ?? '')}
          </h3>
          <p className="mb-2">{error.message}</p>
          
          {error.service && (
            <p className="text-sm mb-2">
              Service: {error.service}
              {error.retryAfter && ` (retry after ${error.retryAfter} seconds)`}
            </p>
          )}
          
          {error.context && typeof error.context === 'object' && (
            <div className="text-sm mb-2">
              <p>Context:</p>
              <ul className="list-disc list-inside pl-2">
                {'topic' in error.context && typeof error.context.topic === 'string' && error.context.topic ? (
                  <li>Topic: {error.context.topic}</li>
                ) : null}
                {'level' in error.context && typeof error.context.level === 'string' && error.context.level ? (
                  <li>Level: {error.context.level}</li>
                ) : null}
              </ul>
            </div>
          )}
          
          {'recommendations' in error && Array.isArray(error.recommendations) && error.recommendations.length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold mb-1">Recommendations:</h4>
              <ul className="list-disc list-inside text-sm">
                {error.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
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
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
    </div>
  );
};

export default ErrorDisplay;
