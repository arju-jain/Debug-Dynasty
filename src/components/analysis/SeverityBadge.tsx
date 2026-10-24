import React from 'react';
import { ErrorCategory } from '../../types/api';
import { getSeverityStyle } from '../../utils/formatters';

interface SeverityBadgeProps {
  category: ErrorCategory | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ category, size = 'md' }) => {
  const style = getSeverityStyle(category);

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-mono font-medium rounded-md border ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${style.bg} ${style.text} ${style.border}`}
      title={`Backend classified category: ${category}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{category || 'Unknown'}</span>
    </span>
  );
};
