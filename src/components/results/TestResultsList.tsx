import React from 'react';
import { RunTestsResponse, TestCaseResult } from '../../types/api';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { VerificationBadge } from '../analysis/VerificationBadge';

interface TestResultsListProps {
  testResponse?: RunTestsResponse | null;
  isRunning?: boolean;
}

export const TestResultsList: React.FC<TestResultsListProps> = ({ testResponse, isRunning }) => {
  if (isRunning) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-[#2563EB] dark:text-blue-300">Executing test cases in isolated sandbox...</p>
      </div>
    );
  }

  if (!testResponse) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs font-mono">
        No test run results yet. Click "Run Tests" to execute your test cases against the code in the sandbox.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Test Run Summary Header */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-[#DBEAFE] dark:bg-slate-900 dark:border-white/10">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-[#0F172A] dark:text-white">
            Passed: {testResponse.passed_count} / {testResponse.total_count}
          </span>
          <VerificationBadge status={testResponse.verification_status} size="sm" />
        </div>
        {testResponse.execution_time_ms !== undefined && (
          <span className="flex items-center space-x-1 text-[11px] font-mono text-[#475569] dark:text-slate-400">
            <Clock className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />
            <span>{testResponse.execution_time_ms} ms</span>
          </span>
        )}
      </div>

      {/* Test Cases List */}
      <div className="space-y-2">
        {testResponse.results?.map((result, idx) => {
          const status = result.status || (result.passed ? 'PASS' : 'FAIL');
          const isPass = status === 'PASS';
          const isError = status === 'ERROR';

          const cardBgClass = isPass
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-300'
            : isError
            ? 'bg-amber-50/70 border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-500/30 dark:text-amber-300'
            : 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-500/30 dark:text-rose-300';

          const badgeClass = isPass
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : isError
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30';

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs font-mono space-y-2 transition ${cardBgClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : isError ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="font-semibold">{result.name || `Test Case #${idx + 1}`}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${badgeClass}`}>
                  {status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-white/80 border border-slate-200/60 dark:border-transparent dark:bg-black/30 p-2 rounded">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Input:</span>
                  <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all">{result.input || '(empty)'}</pre>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Expected:</span>
                  <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap break-all">{result.expected_output}</pre>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Actual Output:</span>
                  <pre className={`whitespace-pre-wrap break-all ${isPass ? 'text-emerald-700 dark:text-emerald-300' : isError ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {result.actual_output || '(no output)'}
                  </pre>
                </div>
              </div>

              {result.error_message && (
                <div className={`p-2 rounded text-[11px] flex items-start space-x-1.5 ${isError ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="break-all">{result.error_message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
