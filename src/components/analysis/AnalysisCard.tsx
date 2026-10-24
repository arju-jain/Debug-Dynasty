import React from 'react';
import { DebugResponse } from '../../types/api';
import { SeverityBadge } from './SeverityBadge';
import { VerificationBadge } from './VerificationBadge';
import { LearningExplanation } from './LearningExplanation';
import { QualitySuggestions } from './QualitySuggestions';
import { 
  AlertOctagon, 
  Search, 
  MapPin, 
  FileCode, 
  HelpCircle, 
  CheckSquare, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AnalysisCardProps {
  analysis: DebugResponse;
  onApplyFix?: () => void;
  onAddSuggestedCase?: (testCase: { input: string; expected_output: string }) => void;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  onApplyFix,
  onAddSuggestedCase,
}) => {
  const isDemoSimulation = 
    analysis.explanation?.includes('[DEMO') || 
    analysis.explanation?.includes('[SIMULATED') ||
    analysis.root_cause?.includes('[DEMO') ||
    analysis.root_cause?.includes('[SIMULATED');

  return (
    <div className="space-y-4">
      {/* Simulation / Demo Mode Alert Banner if mock engine responded */}
      {isDemoSimulation && (
        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs shadow-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold tracking-wide uppercase text-[11px] text-amber-700 dark:text-amber-400">
            <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 font-mono text-[10px]">
              DEMO MODE
            </span>
            <span>Simulated AI Analysis</span>
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-mono">
            This diagnosis is simulated by the backend offline mock engine for hackathon evaluation and demonstration.
          </p>
        </div>
      )}

      {/* Top Banner: Detected Issue & Status */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#DBEAFE] bg-white shadow-xs dark:bg-midnight-900/90 dark:border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DBEAFE]/60 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <SeverityBadge category={analysis.error_category} />
            {analysis.affected_line !== null && analysis.affected_line !== undefined && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-blue-50 border border-[#DBEAFE] text-[#1D4ED8] dark:bg-white/5 dark:border-white/10 dark:text-slate-300">
                <MapPin className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />
                <span>Line {analysis.affected_line}</span>
              </span>
            )}
          </div>
          <VerificationBadge status={analysis.verification_status} />
        </div>

        {/* Issue Title */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Detected Issue
          </span>
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mt-0.5 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{analysis.detected_issue}</span>
          </h3>
        </div>

        {/* Root Cause */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 dark:bg-midnight-800/80 dark:border-white/5">
          <div className="flex items-center space-x-1.5 text-xs text-amber-800 dark:text-amber-400 font-semibold mb-1">
            <Search className="w-3.5 h-3.5" />
            <span>Root Cause</span>
          </div>
          <p className="text-xs text-[#0F172A] dark:text-slate-300 leading-relaxed font-mono">
            {analysis.root_cause}
          </p>
        </div>

        {/* Technical Explanation */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Technical Analysis
          </span>
          <p className="mt-1 text-xs text-[#475569] dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
            {analysis.explanation}
          </p>
        </div>

        {/* Recommended Fix Summary */}
        {analysis.recommended_fix && (
          <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] dark:bg-slate-800 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1D4ED8] dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" /> Recommended Fix
              </span>
              {onApplyFix && (
                <button
                  onClick={onApplyFix}
                  className="px-3 py-1 text-[11px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition shadow-xs"
                >
                  Apply Fix
                </button>
              )}
            </div>
            <p className="text-xs text-[#475569] dark:text-slate-200 leading-relaxed font-sans">
              {analysis.recommended_fix}
            </p>
          </div>
        )}
      </div>

      {/* Explain Like I'm Learning section */}
      <LearningExplanation
        explanation={analysis.explain_like_learning}
        assumptions={analysis.assumptions_and_uncertainty}
      />

      {/* Quality Suggestions */}
      {analysis.quality_suggestions && analysis.quality_suggestions.length > 0 && (
        <QualitySuggestions suggestions={analysis.quality_suggestions} />
      )}

      {/* Suggested Additional Tests */}
      {analysis.suggested_additional_tests && analysis.suggested_additional_tests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-[#DBEAFE] bg-white shadow-xs dark:border-white/10 dark:bg-midnight-900/70 space-y-2.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#0F172A] dark:text-slate-200">
            <CheckSquare className="w-4 h-4 text-[#2563EB]" />
            <span>Suggested Additional Tests:</span>
          </div>
          <p className="text-[11px] text-[#475569] dark:text-slate-400">
            The AI engine identified edge cases that could uncover regressions:
          </p>
          <div className="space-y-1.5 pt-1">
            {analysis.suggested_additional_tests.map((tc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/30 border border-[#DBEAFE] dark:bg-midnight-800/80 dark:border-white/5 text-xs font-mono"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-[#2563EB] font-semibold">In:</span>
                  <span className="text-[#0F172A] dark:text-slate-300 truncate max-w-[150px]">{tc.input}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-2">Exp:</span>
                  <span className="text-[#0F172A] dark:text-slate-300 truncate max-w-[150px]">{tc.expected_output}</span>
                </div>
                {onAddSuggestedCase && (
                  <button
                    onClick={() => onAddSuggestedCase(tc)}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-[#DBEAFE] text-[10px] font-semibold whitespace-nowrap transition"
                  >
                    + Add to Tests
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
