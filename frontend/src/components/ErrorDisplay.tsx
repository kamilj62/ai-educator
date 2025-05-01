import React from 'react';
import { APIError } from '../store/presentationSlice';

interface ErrorDisplayProps {
  error: APIError | null;
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
    </div>
  );
};

export default ErrorDisplay;
