import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  subtext?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text, 
  subtext 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-[#DBEAFE] border-t-[#2563EB] animate-spin`}
      />
      {text && (
        <p className="mt-3 text-xs font-semibold text-[#0F172A] dark:text-slate-200">{text}</p>
      )}
      {subtext && (
        <p className="mt-1 text-xs text-[#475569] dark:text-slate-400 max-w-xs">{subtext}</p>
      )}
    </div>
  );
};
