import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Bug, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] dark:bg-slate-800 dark:border-white/10 dark:text-blue-400">
        <Terminal className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">404 — Page Not Found</h1>
      <p className="text-xs text-[#475569] dark:text-slate-400 max-w-md leading-relaxed">
        The route you are navigating to does not exist in the Debug Dynasty workspace. Return to the debugger or overview.
      </p>
      <div className="pt-2 flex items-center space-x-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#0F172A] bg-white hover:bg-slate-50 border border-[#DBEAFE] transition dark:text-slate-200 dark:bg-slate-800 dark:border-white/10"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/debugger"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm transition"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Open Debugger</span>
        </Link>
      </div>
    </div>
  );
};
