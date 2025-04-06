import React from 'react';
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorMessageProps {
  message: string;
  suggestion?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  suggestion 
}) => {
  return (
    <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg mb-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-red-200 font-medium">{message}</p>
          {suggestion && (
            <p className="text-gray-400 mt-1 text-sm">{suggestion}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 