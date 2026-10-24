import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[#DBEAFE] bg-white dark:border-white/10 dark:bg-slate-900/40">
      <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] mb-3 dark:bg-slate-800 dark:border-white/10 dark:text-blue-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-[#475569] dark:text-slate-400 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs"
        >
          {ActionIcon && <ActionIcon className="w-3.5 h-3.5 mr-1" />}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
