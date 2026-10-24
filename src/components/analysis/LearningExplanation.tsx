import React from 'react';
import { GraduationCap, Compass } from 'lucide-react';

interface LearningExplanationProps {
  explanation?: string;
  assumptions?: string[] | string;
}

export const LearningExplanation: React.FC<LearningExplanationProps> = ({
  explanation,
  assumptions,
}) => {
  if (!explanation && !assumptions) {
    return null;
  }

  const assumptionsList = Array.isArray(assumptions)
    ? assumptions
    : assumptions
    ? [assumptions]
    : [];

  return (
    <div className="rounded-2xl border border-[#DBEAFE] bg-blue-50/60 dark:border-blue-500/20 dark:bg-slate-900/40 p-4 space-y-3">
      <div className="flex items-center space-x-2 text-[#0F172A] dark:text-blue-300">
        <div className="p-1.5 rounded-lg bg-blue-100 border border-blue-200 text-[#2563EB] dark:bg-blue-500/20 dark:border-blue-500/30">
          <GraduationCap className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-white">Explain Like I'm Learning</h4>
      </div>

      {explanation && (
        <div className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed space-y-2">
          <p>{explanation}</p>
        </div>
      )}

      {assumptionsList.length > 0 && (
        <div className="pt-2 border-t border-[#DBEAFE] dark:border-white/10">
          <div className="flex items-center space-x-1.5 text-xs text-[#1D4ED8] dark:text-blue-400 font-semibold mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Assumptions & Uncertainty Made by AI:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-[#475569] dark:text-slate-300">
            {assumptionsList.map((item, idx) => (
              <li key={idx} className="leading-normal">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
