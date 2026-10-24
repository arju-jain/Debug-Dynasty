import { ErrorCategory, VerificationStatus } from '../types/api';

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return dateString;
  }
}

export function getSeverityStyle(category: ErrorCategory | string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (category) {
    case 'Syntax':
      return {
        bg: 'bg-red-50 dark:bg-red-500/10',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-500/30',
        dot: 'bg-red-500',
      };
    case 'Runtime':
      return {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-500/30',
        dot: 'bg-rose-500',
      };
    case 'Logic':
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-800 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'Type':
      return {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-[#1D4ED8] dark:text-cyan-400',
        border: 'border-[#DBEAFE] dark:border-blue-500/30',
        dot: 'bg-[#2563EB]',
      };
    case 'Boundary Condition':
      return {
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        text: 'text-orange-800 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-500/30',
        dot: 'bg-orange-500',
      };
    case 'Unknown':
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-500/10',
        text: 'text-slate-700 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-500/30',
        dot: 'bg-slate-400',
      };
  }
}

export function getVerificationStatusStyle(status: VerificationStatus | string): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (status) {
    case 'Tests Passed':
    case 'Validated':
    case 'Fix Validated':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        glow: 'shadow-xs',
      };
    case 'Partially Fixed':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-500/30',
        glow: 'shadow-xs',
      };
    case 'Defects Detected':
    case 'Tests Failed':
    case 'Validation Failed':
      return {
        bg: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-500/30',
        glow: 'shadow-xs',
      };
    case 'Suggested':
      return {
        bg: 'bg-blue-50 text-[#1D4ED8] border-[#DBEAFE] dark:bg-blue-500/10 dark:text-cyan-300 dark:border-blue-500/30',
        text: 'text-[#1D4ED8] dark:text-cyan-300',
        border: 'border-[#DBEAFE] dark:border-blue-500/30',
        glow: '',
      };
    case 'Not Runtime Tested':
    case 'Not Verified':
    default:
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
        text: 'text-amber-800 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-500/30',
        glow: '',
      };
  }
}
