import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  const getErrorTitle = (type: string) => {
    switch (type) {
      case 'RATE_LIMIT':
        return 'Rate Limit Exceeded';
      case 'QUOTA_EXCEEDED':
        return 'API Quota Exceeded';
      case 'SAFETY_VIOLATION':
        return 'Content Safety Warning';
      case 'INVALID_REQUEST':
        return 'Invalid Request';
      case 'API_ERROR':
        return 'API Error';
      case 'NETWORK_ERROR':
        return 'Network Error';
      default:
        return 'Error';
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'RATE_LIMIT':
      case 'QUOTA_EXCEEDED':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'SAFETY_VIOLATION':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'INVALID_REQUEST':
      case 'API_ERROR':
        return 'bg-orange-100 border-orange-400 text-orange-700';
      case 'NETWORK_ERROR':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  return (
    <div className={`rounded-lg border p-4 mb-4 ${getErrorColor(error ?? '')}`}>
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
    </div>
  );
};

export default ErrorDisplay;
