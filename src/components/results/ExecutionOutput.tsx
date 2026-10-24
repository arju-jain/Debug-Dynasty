import React from 'react';
import { Terminal, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface ExecutionOutputProps {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  executionTimeMs?: number;
  validationDetails?: string;
}

export const ExecutionOutput: React.FC<ExecutionOutputProps> = ({
  stdout,
  stderr,
  exitCode,
  executionTimeMs,
  validationDetails,
}) => {
  const hasOutput = stdout || stderr || exitCode !== undefined || validationDetails;

  if (!hasOutput) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs font-mono">
        Terminal output stream empty. Run tests or validate fix to stream isolated runtime stdout/stderr.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Output meta banner */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-[#DBEAFE] text-[#0F172A] dark:bg-slate-900 dark:border-white/10 dark:text-slate-300">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
          <span className="font-semibold text-[#0F172A] dark:text-slate-300">Isolated Sandbox Runtime</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          {exitCode !== undefined && (
            <span
              className={`flex items-center space-x-1 font-semibold ${
                exitCode === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {exitCode === 0 ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>Exit Code: {exitCode}</span>
            </span>
          )}
          {executionTimeMs !== undefined && (
            <span className="flex items-center space-x-1 text-[#475569] dark:text-slate-400">
              <Clock className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />
              <span>{executionTimeMs} ms</span>
            </span>
          )}
        </div>
      </div>

      {validationDetails && (
        <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#0F172A] dark:bg-slate-800 dark:border-white/10 dark:text-slate-200">
          <p className="font-semibold mb-1 text-[11px] uppercase tracking-wider text-[#1D4ED8] dark:text-blue-300">Validation Feedback</p>
          <p className="text-[#475569] dark:text-slate-300 leading-relaxed font-sans">{validationDetails}</p>
        </div>
      )}

      {/* Stdout */}
      {stdout && (
        <div className="space-y-1">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider block font-medium">Standard Output (STDOUT)</span>
          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 dark:bg-black/60 dark:border-white/5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {stdout}
          </pre>
        </div>
      )}

      {/* Stderr */}
      {stderr && (
        <div className="space-y-1">
          <span className="text-rose-600 dark:text-rose-400 text-[10px] uppercase tracking-wider block font-medium">Standard Error (STDERR)</span>
          <pre className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-500/20 dark:text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {stderr}
          </pre>
        </div>
      )}
    </div>
  );
};
