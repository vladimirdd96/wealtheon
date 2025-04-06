import React from 'react';
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  actionButton?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon: Icon = InformationCircleIcon, 
  actionButton 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px] border border-gray-800 rounded-lg bg-gray-900/50">
      <Icon className="h-12 w-12 text-gray-500 mb-3" />
      <h3 className="text-lg font-medium text-gray-200 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-center max-w-md mb-4">{description}</p>
      )}
      {actionButton && (
        <div className="mt-2">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState; 