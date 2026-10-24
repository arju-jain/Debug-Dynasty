import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

interface QualitySuggestionsProps {
  suggestions?: string[];
}

export const QualitySuggestions: React.FC<QualitySuggestionsProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] dark:border-white/10 dark:bg-slate-800 p-4 space-y-2">
      <div className="flex items-center space-x-2 text-[#1D4ED8] dark:text-blue-300">
        <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
        <h4 className="text-xs font-semibold uppercase tracking-wider">Code Quality Suggestions</h4>
      </div>
      <ul className="space-y-1.5 pt-1">
        {suggestions.map((suggestion, idx) => (
          <li key={idx} className="flex items-start space-x-2 text-xs text-[#0F172A] dark:text-slate-300 leading-relaxed">
            <CheckCircle className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
