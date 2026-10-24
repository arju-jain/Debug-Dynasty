import React from 'react';
import { EvaluationCategoryBreakdown } from '../../types/api';

interface BenchmarkBarChartProps {
  data: Record<string, EvaluationCategoryBreakdown>;
  title: string;
}

export const BenchmarkBarChart: React.FC<BenchmarkBarChartProps> = ({ data, title }) => {
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs font-mono">
        No breakdown data available.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-[#DBEAFE] bg-white shadow-xs dark:border-white/10 dark:bg-midnight-900/80 space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] dark:text-slate-300 font-mono">{title}</h4>
      <div className="space-y-3">
        {entries.map(([key, item]) => {
          const rate = Math.round(item.rate || (item.total > 0 ? (item.success / item.total) * 100 : 0));
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[#0F172A] dark:text-slate-300 capitalize font-medium">{key}</span>
                <span className="font-mono text-[#475569] dark:text-slate-400">
                  <span className="text-[#2563EB] dark:text-blue-400 font-semibold">{rate}%</span> ({item.success}/{item.total})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 border border-[#DBEAFE] dark:bg-slate-800 dark:border-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
