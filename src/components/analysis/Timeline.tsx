import React from 'react';
import { Check, Clock, Loader2, Sparkles, ShieldCheck, TestTube } from 'lucide-react';

export interface TimelineState {
  isSubmitted: boolean;
  isAnalysing: boolean;
  fixSuggested: boolean;
  validationRequested: boolean;
  validationCompleted: boolean;
  testsRequested: boolean;
  testsCompleted: boolean;
}

interface TimelineProps {
  state: TimelineState;
}

export const Timeline: React.FC<TimelineProps> = ({ state }) => {
  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      desc: 'Code payload sent to engine',
      isCompleted: state.isSubmitted,
      isActive: state.isSubmitted && !state.fixSuggested && state.isAnalysing,
      icon: Clock,
    },
    {
      id: 'analysing',
      label: 'Analysing',
      desc: 'AI parsing syntax & logic',
      isCompleted: state.fixSuggested,
      isActive: state.isAnalysing,
      icon: state.isAnalysing ? Loader2 : Sparkles,
    },
    {
      id: 'fix_suggested',
      label: 'Fix Suggested',
      desc: 'Fix & diff generated',
      isCompleted: state.fixSuggested,
      isActive: state.fixSuggested && !state.validationCompleted && !state.testsCompleted,
      icon: Sparkles,
    },
    {
      id: 'validation',
      label: 'Validation Requested',
      desc: 'Dry-run validation checks',
      isCompleted: state.validationCompleted,
      isActive: state.validationRequested && !state.validationCompleted,
      icon: ShieldCheck,
    },
    {
      id: 'tests',
      label: 'Tests Completed',
      desc: 'Isolated test execution',
      isCompleted: state.testsCompleted,
      isActive: state.testsRequested && !state.testsCompleted,
      icon: TestTube,
    },
  ];

  return (
    <div className="w-full py-3 px-4 rounded-xl border border-[#DBEAFE] bg-white/90 shadow-xs dark:border-white/10 dark:bg-midnight-900/60 backdrop-blur-sm transition-colors">
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2 scrollbar-none">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = step.isCompleted;
          const isCurrent = step.isActive;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-2.5 min-w-max">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/50'
                      : isCurrent
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#2563EB] animate-pulse dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/50'
                      : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                  }`}
                  title={`${step.label}: ${step.desc}`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Icon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-xs font-medium font-mono ${
                      isDone
                        ? 'text-[#16A34A] dark:text-emerald-300'
                        : isCurrent
                        ? 'text-[#1D4ED8] dark:text-blue-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:inline">
                    {step.desc}
                  </span>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[20px] max-w-[60px] mx-1 transition-colors ${
                    step.isCompleted ? 'bg-emerald-300 dark:bg-emerald-500/40' : 'bg-slate-200 dark:bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
