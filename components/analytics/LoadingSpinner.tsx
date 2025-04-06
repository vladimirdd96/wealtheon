import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading data..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mb-4"></div>
      <div className="text-violet-200 text-lg">{message}</div>
    </div>
  );
};

export default LoadingSpinner; 