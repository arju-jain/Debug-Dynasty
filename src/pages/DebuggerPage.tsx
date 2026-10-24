import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  DebugRequest, 
  DebugResponse, 
  Issue,
  RunTestsResponse, 
  SupportedLanguage, 
  TestCase, 
  ValidateFixResponse,
  VerificationStatus 
} from '../types/api';
import * as debugApi from '../api/debug';
import { getLanguages, DEFAULT_LANGUAGES } from '../api/languages';
import { CODE_EXAMPLES } from '../utils/codeSamples';
import { extractErrorMessage } from '../api/client';
import { CodeEditor } from '../components/editor/CodeEditor';
import { DiffViewer } from '../components/editor/DiffViewer';
import { VerificationBadge } from '../components/analysis/VerificationBadge';
import { useToast } from '../components/common/Toast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useApiHealth } from '../context/ApiHealthContext';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/common/AuthModal';
import { getStoredTrialsRemaining, setStoredTrialsRemaining, resetDynastyTrials, isDevEnvironment, syncTrialsWithServer } from '../utils/trialManager';
import { detectLanguage, LanguageDetectionResult } from '../utils/languageDetector';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Code2, 
  Check, 
  Trash2, 
  FileCode, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Terminal, 
  ChevronDown, 
  Bot, 
  AlertTriangle,
  Sparkles,
  Layers,
  Copy,
  ExternalLink,
  MapPin,
  Play,
  Plus,
  Edit2,
  Save,
  X
} from 'lucide-react';

export const DebuggerPage: React.FC = () => {
  const toast = useToast();
  const { isHealthy } = useApiHealth();
  const { isAuthenticated } = useAuth();

  // Languages state — default to auto-detect unless user set a preference
  const [languages, setLanguages] = useState<SupportedLanguage[]>(DEFAULT_LANGUAGES);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => localStorage.getItem('debugdynasty_default_lang') || 'auto');

  // Automatic language detection state
  const [detectionResult, setDetectionResult] = useState<LanguageDetectionResult>({
    language: null,
    status: 'empty',
    displayName: '',
    message: 'Language not detected yet',
    confidence: 0,
  });
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  // Input states
  const [code, setCode] = useState<string>('');
  const [analyzedCode, setAnalyzedCode] = useState<string | null>(null);
  const [errorDescription, setErrorDescription] = useState<string>('');
  const [expectedBehavior, setExpectedBehavior] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Two Free Trials State
  const [trialsRemaining, setTrialsRemaining] = useState<number>(() => getStoredTrialsRemaining());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Analysis / Output states
  const [analysisResult, setAnalysisResult] = useState<DebugResponse | null>(null);
  const [correctedCode, setCorrectedCode] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidateFixResponse | null>(null);
  const [testRunResult, setTestRunResult] = useState<RunTestsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [highlightColumn, setHighlightColumn] = useState<number | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  // Tracks whether the fix was explicitly applied AND revalidated — prevents false "Fix Validated" display
  const [fixRevalidated, setFixRevalidated] = useState<boolean>(false);

  // Loading states
  const [isDebugging, setIsDebugging] = useState<boolean>(false);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  // Test Cases & Sandbox runner state
  const [testedCode, setTestedCode] = useState<string | null>(null);
  const [isAddingTestCase, setIsAddingTestCase] = useState<boolean>(false);
  const [editingTestCaseIdx, setEditingTestCaseIdx] = useState<number | null>(null);
  const [tcFormName, setTcFormName] = useState<string>('');
  const [tcFormInput, setTcFormInput] = useState<string>('');
  const [tcFormExpected, setTcFormExpected] = useState<string>('');
  const [tcFormError, setTcFormError] = useState<string | null>(null);

  // Stale async response tracking
  const requestIdRef = useRef<number>(0);
  const codeRef = useRef<string>(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Debounced language detection on code change
  useEffect(() => {
    if (!code.trim()) {
      setDetectionResult({
        language: null,
        status: 'empty',
        displayName: '',
        message: 'Language not detected yet',
        confidence: 0,
      });
      setIsDetecting(false);
      return;
    }

    setIsDetecting(true);
    const timer = setTimeout(() => {
      const res = detectLanguage(code);
      setDetectionResult(res);
      setIsDetecting(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [code]);

  // Resolved language for Monaco and backend (effective language)
  const resolvedLanguage = useMemo(() => {
    if (selectedLanguage !== 'auto') {
      return selectedLanguage;
    }
    if (detectionResult.language) {
      return detectionResult.language;
    }
    if (code.trim()) {
      const immediate = detectLanguage(code);
      return immediate.language || 'plaintext';
    }
    return 'plaintext';
  }, [selectedLanguage, detectionResult.language, code]);

  const effectiveLanguage = resolvedLanguage !== 'plaintext' ? resolvedLanguage : 'python';
  const currentLanguageObj = languages.find((l) => l.id === effectiveLanguage) || DEFAULT_LANGUAGES.find((l) => l.id === effectiveLanguage);

  // Sync trials to localStorage via trialManager
  useEffect(() => {
    setStoredTrialsRemaining(trialsRemaining);
  }, [trialsRemaining]);

  // On mount, sync trials with authoritative server state
  useEffect(() => {
    let isMounted = true;
    syncTrialsWithServer().then((count) => {
      if (isMounted) {
        setTrialsRemaining(count);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Listen for reset and update events (e.g. from window.resetDynastyTrials() or Dev Reset actions)
  useEffect(() => {
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent<{ trials: number }>;
      setTrialsRemaining(customEvent.detail?.trials ?? 2);
    };
    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ trials: number }>;
      if (typeof customEvent.detail?.trials === 'number') {
        setTrialsRemaining(customEvent.detail.trials);
      }
    };
    window.addEventListener('debugdynasty:reset_trials', handleReset);
    window.addEventListener('debugdynasty:trials_updated', handleUpdated);
    return () => {
      window.removeEventListener('debugdynasty:reset_trials', handleReset);
      window.removeEventListener('debugdynasty:trials_updated', handleUpdated);
    };
  }, []);

  // Load languages
  useEffect(() => {
    let isMounted = true;
    getLanguages().then((langs) => {
      if (isMounted && langs && langs.length > 0) {
        setLanguages(langs);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Test Case Management Handlers
  const handleStartAddTestCase = () => {
    setIsAddingTestCase(true);
    setEditingTestCaseIdx(null);
    setTcFormName(`Test Case #${testCases.length + 1}`);
    setTcFormInput('');
    setTcFormExpected('');
    setTcFormError(null);
  };

  const handleStartEditTestCase = (idx: number) => {
    const tc = testCases[idx];
    setIsAddingTestCase(true);
    setEditingTestCaseIdx(idx);
    setTcFormName(tc.name || `Test Case #${idx + 1}`);
    setTcFormInput(tc.input || '');
    setTcFormExpected(tc.expected_output || '');
    setTcFormError(null);
  };

  const handleCancelTestCaseForm = () => {
    setIsAddingTestCase(false);
    setEditingTestCaseIdx(null);
    setTcFormName('');
    setTcFormInput('');
    setTcFormExpected('');
    setTcFormError(null);
  };

  const handleSaveTestCase = () => {
    if (!tcFormExpected.trim() && !tcFormInput.trim()) {
      setTcFormError('Please enter at least expected output or test input.');
      return;
    }
    if (!tcFormExpected.trim()) {
      setTcFormError('Expected output is required.');
      return;
    }

    const newTc: TestCase = {
      name: tcFormName.trim() || `Test Case #${(editingTestCaseIdx !== null ? editingTestCaseIdx : testCases.length) + 1}`,
      input: tcFormInput,
      expected_output: tcFormExpected,
    };

    if (editingTestCaseIdx !== null) {
      const updated = [...testCases];
      updated[editingTestCaseIdx] = newTc;
      setTestCases(updated);
      toast.success('Test Case Updated', `Updated "${newTc.name}"`);
    } else {
      setTestCases([...testCases, newTc]);
      toast.success('Test Case Added', `Added "${newTc.name}"`);
    }

    setIsAddingTestCase(false);
    setEditingTestCaseIdx(null);
    setTcFormName('');
    setTcFormInput('');
    setTcFormExpected('');
    setTcFormError(null);
    setTestRunResult(null);
    setTestedCode(null);
  };

  const handleDeleteTestCase = (idx: number) => {
    const removed = testCases[idx];
    const updated = testCases.filter((_, i) => i !== idx);
    setTestCases(updated);
    if (editingTestCaseIdx === idx) {
      setIsAddingTestCase(false);
      setEditingTestCaseIdx(null);
    }
    setTestRunResult(null);
    setTestedCode(null);
    toast.info('Test Case Removed', `Removed "${removed.name || `Test Case #${idx + 1}`}"`);
  };

  // Handle Clear Code
  const handleClearCode = () => {
    setCode('');
    setAnalyzedCode(null);
    setErrorDescription('');
    setExpectedBehavior('');
    setStdin('');
    setTestCases([]);
    setIsAddingTestCase(false);
    setEditingTestCaseIdx(null);
    setTcFormName('');
    setTcFormInput('');
    setTcFormExpected('');
    setTcFormError(null);
    setTestedCode(null);
    setAnalysisResult(null);
    setCorrectedCode('');
    setValidationResult(null);
    setTestRunResult(null);
    setErrorMessage(null);
    setHighlightLine(null);
    setHighlightColumn(null);
    setSelectedIssueId(null);
    setFixRevalidated(false);
    toast.info('Cleared', 'Code editor and description cleared.');
  };

  // Handle Load Example
  const handleLoadExample = () => {
    const langKey = selectedLanguage === 'auto' ? 'python' : selectedLanguage;
    const example = CODE_EXAMPLES[langKey] || CODE_EXAMPLES.python;
    setCode(example.code);
    setAnalyzedCode(null);
    setErrorDescription(example.error_description);
    setExpectedBehavior(example.expected_behavior);
    setStdin(example.stdin || '');
    setTestCases(example.test_cases || []);
    setIsAddingTestCase(false);
    setEditingTestCaseIdx(null);
    setTcFormName('');
    setTcFormInput('');
    setTcFormExpected('');
    setTcFormError(null);
    setTestedCode(null);
    setAnalysisResult(null);
    setCorrectedCode('');
    setValidationResult(null);
    setTestRunResult(null);
    setErrorMessage(null);
    const immediate = detectLanguage(example.code);
    setDetectionResult(immediate);
    toast.info('Example Loaded', `Loaded sample: "${example.title}"`);
  };

  // Handle Debug Submission
  const handleDebug = useCallback(async () => {
    if (!code.trim()) {
      toast.warning('Empty Code', 'Please enter some code or load an example to debug.');
      return;
    }

    const languageToSend = selectedLanguage === 'auto'
      ? (resolvedLanguage !== 'plaintext' ? resolvedLanguage : null)
      : selectedLanguage;

    if (!languageToSend) {
      toast.warning('Language Uncertain', 'Please select a language or enter code so Debug Dynasty can detect it.');
      return;
    }

    // Two Free Trials Policy Enforcement (bypassed if logged in)
    if (!isAuthenticated && trialsRemaining <= 0) {
      toast.warning('Free Trials Used', 'You have used your 2 free trials. Please sign in to continue.');
      setAuthModalOpen(true);
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    const submittedCode = code;

    setIsDebugging(true);
    setErrorMessage(null);
    setValidationResult(null);
    setTestRunResult(null);
    setFixRevalidated(false);

    try {
      const payload: DebugRequest = {
        language: languageToSend,
        code: submittedCode,
        error_description: errorDescription,
        expected_behavior: expectedBehavior,
        stdin: stdin.trim() ? stdin : undefined,
        test_cases: testCases.filter((tc) => tc.input || tc.expected_output),
      };

      const response = await debugApi.debugCode(payload);

      // Guard: Discard stale asynchronous responses if a newer request or edit occurred
      if (requestIdRef.current !== thisRequestId) {
        return;
      }

      setAnalysisResult(response);
      setCorrectedCode(response.corrected_code || '');
      setAnalyzedCode(submittedCode);

      // Decrement or sync free trials only for anonymous users upon successful debugging
      if (!isAuthenticated) {
        if (typeof response.trials_remaining === 'number') {
          setTrialsRemaining(response.trials_remaining);
        } else {
          setTrialsRemaining((prev) => Math.max(0, prev - 1));
        }
      }

      // Highlight first issue line in Monaco editor if available
      if (response.affected_line) {
        setHighlightLine(response.affected_line);
      } else if (response.issues && response.issues.length > 0 && response.issues[0].line) {
        setHighlightLine(response.issues[0].line);
        setHighlightColumn(response.issues[0].column || 1);
        setSelectedIssueId(response.issues[0].id);
      }

      toast.success('Analysis Complete', `Diagnosed: ${response.detected_issue || 'Issue identified and patch generated.'}`);
    } catch (err: any) {
      if (requestIdRef.current !== thisRequestId) return;
      const msg = extractErrorMessage(err);
      if (err?.statusCode === 403 || msg?.toLowerCase().includes('trial') || err?.response?.data?.trial_limit_reached) {
        setTrialsRemaining(0);
        setStoredTrialsRemaining(0);
        setAuthModalOpen(true);
        toast.warning('Free Trials Used', 'You have used your 2 free trials. Please sign in to continue.');
      } else {
        toast.error('Debugging Request Failed', msg);
      }
      setErrorMessage(msg);
    } finally {
      if (requestIdRef.current === thisRequestId) {
        setIsDebugging(false);
      }
    }
  }, [code, selectedLanguage, resolvedLanguage, errorDescription, expectedBehavior, stdin, testCases, trialsRemaining, isAuthenticated, toast]);

  // Copy code handler
  const handleCopyCode = (textToCopy: string, label: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied', `${label} copied to clipboard.`);
  };

  // Compute live verification states for current editor code
  const isEditorModified = Boolean(analysisResult && analyzedCode && code !== analyzedCode);
  // isFixApplied: code matches the corrected version AND fix was explicitly revalidated
  const isFixApplied = Boolean(
    fixRevalidated &&
    analysisResult &&
    !isEditorModified &&
    code === analysisResult.corrected_code
  );
  const editorHasDefects = Boolean(
    analysisResult && 
    analysisResult.issues && 
    analysisResult.issues.length > 0 && 
    !isFixApplied &&
    !isEditorModified
  );

  // Separated validation states for Original Code vs Proposed Fix
  const originalSyntaxStatus = analysisResult?.original_syntax_status || (analysisResult?.issues?.some((i: Issue) => i.category === 'Syntax') ? 'FAILED' : 'PASSED');
  const originalStaticStatus = analysisResult?.original_static_status || (analysisResult?.issues?.some((i: Issue) =>
    ['Logic', 'Boundary Condition', 'Name / Undefined Variable', 'Type', 'Import', 'Runtime'].includes(i.category)
  ) ? 'FAILED' : 'PASSED');
  const originalRuntimeStatus = analysisResult?.original_runtime_status || 'NOT RUN';

  const proposedSyntaxStatus = analysisResult?.proposed_syntax_status || analysisResult?.syntax_status || 'PASSED';
  const proposedStaticStatus = analysisResult?.proposed_static_status || analysisResult?.static_analysis_status || 'PASSED';
  const proposedRuntimeStatus = analysisResult?.proposed_runtime_status || 'NOT RUN';

  // Only consider proposed fix validated when the proposed code actually passed checks
  const isProposedFixValidated = Boolean(
    analysisResult &&
    analysisResult.is_valid_fix &&
    proposedSyntaxStatus === 'PASSED' &&
    proposedStaticStatus !== 'FAILED' &&
    analysisResult.verification_status !== 'Validation Failed'
  );

  let activeVerificationStatus: VerificationStatus = analysisResult?.verification_status || 'Suggested';
  let editorSyntaxStatus = 'PASSED';
  let editorStaticStatus = 'PASSED';
  let editorRuntimeStatus = 'NOT RUN';

  if (analysisResult) {
    if (isEditorModified || isRevalidating) {
      activeVerificationStatus = 'Not Verified';
      editorSyntaxStatus = 'NOT RUN';
      editorStaticStatus = 'NOT RUN';
      editorRuntimeStatus = 'NOT RUN';
    } else if (analysisResult.is_valid_fix === false || analysisResult.verification_status === 'Validation Failed' || analysisResult.verification_status === 'Partially Fixed') {
      activeVerificationStatus = analysisResult.verification_status || 'Validation Failed';
      editorSyntaxStatus = analysisResult.syntax_status || 'FAILED';
      editorStaticStatus = analysisResult.static_analysis_status || 'FAILED';
      editorRuntimeStatus = (testRunResult && (!testedCode || testedCode === code))
        ? (testRunResult.all_passed ? 'PASSED' : 'FAILED')
        : (analysisResult.runtime_status || 'NOT RUN');
    } else if (editorHasDefects) {
      activeVerificationStatus = 'Defects Detected';
      editorSyntaxStatus = originalSyntaxStatus;
      editorStaticStatus = originalStaticStatus;
      editorRuntimeStatus = 'NOT RUN';
    } else if (isFixApplied) {
      activeVerificationStatus = analysisResult.verification_status || 'Fix Validated';
      editorSyntaxStatus = analysisResult.syntax_status || 'PASSED';
      editorStaticStatus = analysisResult.static_analysis_status || 'PASSED';
      editorRuntimeStatus = (testRunResult && (!testedCode || testedCode === code))
        ? (testRunResult.all_passed ? 'PASSED' : 'FAILED')
        : 'NOT RUN';
    } else {
      activeVerificationStatus = analysisResult.verification_status || 'Validated';
      editorSyntaxStatus = analysisResult.syntax_status || 'PASSED';
      editorStaticStatus = analysisResult.static_analysis_status || 'PASSED';
      editorRuntimeStatus = (testRunResult && (!testedCode || testedCode === code))
        ? (testRunResult.all_passed ? 'PASSED' : 'FAILED')
        : 'NOT RUN';
    }
  }

  // Run tests handler
  const handleRunTests = async () => {
    const languageToSend = selectedLanguage === 'auto'
      ? (resolvedLanguage !== 'plaintext' ? resolvedLanguage : 'python')
      : selectedLanguage;

    if (!currentLanguageObj?.sandbox_supported) {
      const err = `Sandbox Execution Unavailable: ${currentLanguageObj?.name || languageToSend} is currently supported for static analysis and AI fixes only. Isolated sandbox runner is available for Python.`;
      setSandboxError(err);
      toast.warning('Sandbox Unavailable', err);
      return;
    }

    if (testCases.length === 0) {
      toast.info('No Test Cases', 'Please add at least one test case before running tests. Use "+ Add Test Case" below to define test inputs and expected outputs.');
      setIsAddingTestCase(true);
      setEditingTestCaseIdx(null);
      setTcFormName('Test Case #1');
      setTcFormInput('');
      setTcFormExpected('');
      setTcFormError(null);
      return;
    }

    setIsRunningTests(true);
    setSandboxError(null);
    try {
      const result = await debugApi.runTests({
        language: languageToSend,
        code,
        test_cases: testCases,
      });
      setTestRunResult(result);
      setTestedCode(code);
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          runtime_status: result.runtime_status || (result.all_passed ? 'PASSED' : 'FAILED'),
          verification_status: result.all_passed ? 'Tests Passed' : 'Tests Failed',
        });
      }
      toast.success('Tests Complete', result.all_passed ? 'Sandbox execution finished successfully' : `${result.passed_count}/${result.total_count} passed`);
    } catch (err: unknown) {
      toast.error('Test Execution Failed', extractErrorMessage(err));
    } finally {
      setIsRunningTests(false);
    }
  };

  // Apply fix handler: updates editor with the COMPLETE corrected code, then revalidates
  const handleApplyFix = async () => {
    if (!correctedCode) return;
    const targetCode = correctedCode;
    // Capture original code BEFORE updating editor state (React state updates are async)
    const originalCodeSnapshot = analyzedCode || code;
    const thisRequestId = ++requestIdRef.current;

    // Immediately update editor with the complete proposed fix and invalidate stale results
    setCode(targetCode);
    codeRef.current = targetCode;
    setIsRevalidating(true);
    setFixRevalidated(false); // reset until revalidation actually completes
    setAnalyzedCode(null);
    setValidationResult(null);
    setTestRunResult(null);
    setTestedCode(null);

    toast.success('Fix Applied', 'Source code updated with the complete AI corrected solution. Re-running validation…');

    const languageToSend = selectedLanguage === 'auto'
      ? (resolvedLanguage !== 'plaintext' ? resolvedLanguage : 'python')
      : selectedLanguage;

    try {
      // Use the pre-captured original code — code state may not have re-rendered yet
      const valRes = await debugApi.validateFix({
        language: languageToSend,
        original_code: originalCodeSnapshot,
        corrected_code: targetCode,
        expected_behavior: expectedBehavior,
      });

      // Guard: Discard stale revalidation response if a newer request was issued
      if (requestIdRef.current !== thisRequestId) {
        return;
      }

      setAnalyzedCode(targetCode);
      setValidationResult(valRes);
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          verification_status: valRes.verification_status,
          is_valid_fix: valRes.is_valid,
          validation_note: valRes.validation_details,
          syntax_status: valRes.syntax_status,
          static_analysis_status: valRes.static_analysis_status,
          runtime_status: valRes.runtime_status,
          remaining_issues: valRes.remaining_issues || [],
          original_issues: analysisResult.original_issues || analysisResult.issues || [],
          issues: valRes.is_valid ? [] : (valRes.remaining_issues || []),
        });
      }

      // Mark fix as revalidated only if validation actually passed
      if (valRes.is_valid) {
        setFixRevalidated(true);
        setHighlightLine(null);
        setHighlightColumn(null);
        setSelectedIssueId(null);
      } else {
        // Revalidation completed but fix is still invalid — do not mark as validated
        setFixRevalidated(false);
        if (valRes.remaining_issues && valRes.remaining_issues.length > 0) {
          const first = valRes.remaining_issues[0];
          if (first.line) {
            setHighlightLine(first.line);
            setHighlightColumn(first.column || 1);
            setSelectedIssueId(first.id);
          }
        }
      }
    } catch (err: unknown) {
      if (requestIdRef.current !== thisRequestId) return;
      const msg = extractErrorMessage(err);
      setFixRevalidated(false);
      toast.error('Validation Check Failed', msg);
    } finally {
      if (requestIdRef.current === thisRequestId) {
        setIsRevalidating(false);
      }
    }
  };

  // Jump editor to selected finding line
  const handleSelectIssue = (iss: Issue) => {
    setSelectedIssueId(iss.id);
    if (iss.line && iss.line > 0) {
      setHighlightLine(iss.line);
      setHighlightColumn(iss.column || 1);
      toast.info(`Focused on Line ${iss.line}`, iss.message);
    }
  };

  useKeyboardShortcuts({
    onDebug: handleDebug,
    onCopyCorrectedCode: () => handleCopyCode(correctedCode, 'Corrected Code'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">
      
      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN WORKSPACE: Panel 2 (Input) & Panel 2 / 3 (Ready / Results)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT PANEL: AI CODE DEBUGGER INPUT                                       */}
        {/* ======================================================================= */}
        <div className="lg:col-span-6 rounded-2xl bg-[#061B35] border border-[#123F70] p-5 sm:p-6 shadow-xl space-y-4">
          
          {/* Header Row */}
          <div className="flex items-start justify-between pb-3 border-b border-[#123F70]/80">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#082344] border border-[#123F70] text-[#087CFF] flex items-center justify-center shadow-glow-cyan">
                <Code2 className="w-4 h-4 text-[#22D3EE]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F1F7FF] tracking-tight">
                  AI Coding Debugger — <span className="text-[#22D3EE]">Debug Dynasty</span>
                </h2>
                <p className="text-[11px] text-[#9DB6D5]">
                  Paste your code, describe the issue, and let AI find the root cause and suggest a fix.
                </p>
              </div>
            </div>

            {/* Trial Counter Pill */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#082344] border border-[#123F70] text-[11px] text-[#9DB6D5]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D6B2]" />
                <span className="font-medium">
                  Free trials remaining: <strong className="text-[#00D6B2]">{trialsRemaining} of 2</strong>
                </span>
                {isDevEnvironment() && trialsRemaining < 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      resetDynastyTrials();
                      toast.info('Trials Reset', 'Anonymous free trials reset to 2.');
                    }}
                    title="Dev/Hackathon Reset (available in dev mode)"
                    className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#123F70] hover:bg-[#1D4ED8] text-[#22D3EE] hover:text-white font-mono cursor-pointer transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Unlimited Sessions (Signed In)</span>
              </div>
            )}
          </div>

          {/* Language Selector Dropdown & Auto-Detection Status */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-[#9DB6D5]">Language</label>
                {currentLanguageObj?.sandbox_supported === false && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium font-mono">
                    Static Analysis Only
                  </span>
                )}
              </div>

              {/* Language Detection Status Indicator */}
              <div>
                {isDetecting ? (
                  <span className="text-[11px] text-[#22D3EE] font-mono flex items-center space-x-1 animate-pulse">
                    <Sparkles className="w-3 h-3 text-[#22D3EE]" />
                    <span>Detecting language…</span>
                  </span>
                ) : selectedLanguage === 'auto' ? (
                  detectionResult.status === 'detected' ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#087CFF]/15 border border-[#087CFF]/40 text-[#22D3EE] font-medium font-mono flex items-center space-x-1 shadow-glow-cyan">
                      <Sparkles className="w-3 h-3 text-[#22D3EE]" />
                      <span>Detected: {detectionResult.displayName}</span>
                    </span>
                  ) : detectionResult.status === 'ambiguous' ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium font-mono flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Language uncertain — please select a language</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6F8BAF] font-mono">
                      Language not detected yet
                    </span>
                  )
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#082344] border border-[#123F70] text-[#9DB6D5] font-mono flex items-center space-x-1">
                    <span>Manual: {currentLanguageObj?.name || selectedLanguage}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLanguage('auto')}
                      className="text-[#22D3EE] hover:underline ml-1 text-[10px]"
                      title="Switch back to automatic detection"
                    >
                      (Auto-Detect)
                    </button>
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full py-2 pl-3 pr-8 rounded-xl bg-[#020817] border border-[#123F70] text-xs font-mono text-[#F1F7FF] appearance-none focus:outline-none focus:border-[#22D3EE]"
                aria-label="Select Programming Language"
              >
                <option value="auto">Auto-Detect Language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Issue Description Input (Required) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-[#9DB6D5]">Issue Description (Required)</label>
              <span className="text-[11px] text-[#6F8BAF] font-mono">{errorDescription.length}/500</span>
            </div>
            <textarea
              rows={2}
              maxLength={500}
              value={errorDescription}
              onChange={(e) => setErrorDescription(e.target.value)}
              placeholder="Describe the bug, error message, or what's not working as expected..."
              className="w-full p-3 rounded-xl bg-[#020817] border border-[#123F70] text-xs text-[#F1F7FF] placeholder-slate-500 focus:outline-none focus:border-[#22D3EE] font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Code Editor Panel */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-[#9DB6D5]">Code Input</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="text-[11px] text-[#22D3EE] hover:underline flex items-center space-x-1"
                >
                  <FileCode className="w-3 h-3" />
                  <span>Load Example</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleClearCode}
                  className="text-[11px] text-[#FB5575] hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Editor Mismatch Banner */}
            {analyzedCode !== null && code !== analyzedCode && analysisResult && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Editor contents modified since last analysis. Click &quot;Debug Code&quot; to re-analyze updated code.</span>
              </div>
            )}

            {/* Monaco / Code Editor Wrapper */}
            <div className="rounded-xl border border-[#123F70] overflow-hidden bg-[#020817] relative">
              <CodeEditor
                value={code}
                onChange={(val) => {
                  setCode(val);
                  // Editing the code invalidates all previous validation and test results
                  if (testRunResult) {
                    setTestRunResult(null);
                  }
                  if (testedCode) {
                    setTestedCode(null);
                  }
                  // Invalidate fix-revalidated status: code has changed, results are stale
                  if (fixRevalidated) {
                    setFixRevalidated(false);
                  }
                }}
                language={resolvedLanguage}
                height="260px"
                highlightLine={highlightLine}
                highlightColumn={highlightColumn}
                issues={analysisResult?.issues || []}
              />
            </div>
          </div>

          {/* Test Cases Section */}
          <div className="pt-2 border-t border-[#123F70]/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#9DB6D5]">
                Test Cases ({testCases.length})
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleStartAddTestCase}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#22D3EE] bg-[#082344] hover:bg-[#078BFF]/20 border border-[#123F70] transition flex items-center space-x-1"
                  aria-label="Add Test Case"
                >
                  <Plus className="w-3 h-3 text-[#22D3EE]" />
                  <span>Add Test Case</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunTests}
                  disabled={isRunningTests || !code.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#22D3EE] bg-[#082344] hover:bg-[#078BFF]/20 border border-[#123F70] disabled:opacity-40 transition flex items-center space-x-1"
                  aria-label="Run Tests"
                >
                  <Play className="w-3 h-3 text-[#22D3EE]" />
                  <span>{isRunningTests ? 'Running...' : 'Run Tests'}</span>
                </button>
              </div>
            </div>

            {/* Sandbox Unavailable Warning */}
            {sandboxError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <p>{sandboxError}</p>
              </div>
            )}

            {/* Add / Edit Form Inline Panel */}
            {isAddingTestCase && (
              <div className="p-3.5 rounded-xl bg-[#082344] border border-[#22D3EE]/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F1F7FF] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>{editingTestCaseIdx !== null ? 'Edit Test Case' : 'New Test Case'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelTestCaseForm}
                    className="text-[#9DB6D5] hover:text-white"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {tcFormError && (
                  <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-mono flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{tcFormError}</span>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9DB6D5] mb-1">
                      Test Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={tcFormName}
                      onChange={(e) => setTcFormName(e.target.value)}
                      placeholder="e.g. 10% Discount on 1000"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#020817] border border-[#123F70] text-[#F1F7FF] text-xs focus:outline-hidden focus:border-[#22D3EE]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#9DB6D5] mb-1">
                      Input (Function arguments or stdin)
                    </label>
                    <input
                      type="text"
                      value={tcFormInput}
                      onChange={(e) => setTcFormInput(e.target.value)}
                      placeholder="e.g. 1000, 10"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#020817] border border-[#123F70] text-[#F1F7FF] text-xs font-mono focus:outline-hidden focus:border-[#22D3EE]"
                    />
                    <span className="text-[10px] text-[#6F8BAF] mt-0.5 block">
                      Separate multiple parameters with commas, e.g. 1000, 10
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#9DB6D5] mb-1">
                      Expected Output <span className="text-[#FB5575]">*</span>
                    </label>
                    <input
                      type="text"
                      value={tcFormExpected}
                      onChange={(e) => setTcFormExpected(e.target.value)}
                      placeholder="e.g. Final price: 900.0"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#020817] border border-[#123F70] text-[#F1F7FF] text-xs font-mono focus:outline-hidden focus:border-[#22D3EE]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-[#123F70]/60">
                  <button
                    type="button"
                    onClick={handleCancelTestCaseForm}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#9DB6D5] hover:bg-[#020817] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTestCase}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-[#020817] bg-[#22D3EE] hover:bg-[#00D6B2] transition flex items-center space-x-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingTestCaseIdx !== null ? 'Update Case' : 'Add Case'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Test Cases List or Empty State */}
            {testCases.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#082344]/40 border border-[#123F70] text-center space-y-2">
                <div className="text-xs text-[#9DB6D5]">
                  No test cases provided for execution.
                </div>
                <p className="text-[11px] text-[#6F8BAF]">
                  Add test cases to execute your code against expected outputs in the secure sandbox.
                </p>
                <button
                  type="button"
                  onClick={handleStartAddTestCase}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold text-[#22D3EE] bg-[#082344] hover:bg-[#078BFF]/20 border border-[#123F70] transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add First Test Case</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {testCases.map((tc, idx) => {
                  const runRes = testRunResult?.results?.[idx];
                  const resStatus = runRes?.status || (runRes ? (runRes.passed ? 'PASS' : 'FAIL') : null);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#082344]/60 border border-[#123F70] space-y-1.5 hover:border-[#22D3EE]/40 transition text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#F1F7FF] flex items-center space-x-1.5 truncate max-w-[200px]">
                          <span>{tc.name || `Test Case #${idx + 1}`}</span>
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {resStatus && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                                resStatus === 'PASS'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : resStatus === 'ERROR'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {resStatus}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditTestCase(idx)}
                            className="p-1 rounded hover:bg-[#020817] text-[#9DB6D5] hover:text-[#22D3EE] transition"
                            title="Edit Test Case"
                            aria-label={`Edit ${tc.name || `Test Case #${idx + 1}`}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestCase(idx)}
                            className="p-1 rounded hover:bg-[#020817] text-[#9DB6D5] hover:text-[#FB5575] transition"
                            title="Delete Test Case"
                            aria-label={`Delete ${tc.name || `Test Case #${idx + 1}`}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#020817] p-2 rounded-lg border border-[#123F70]/50">
                        <div>
                          <span className="text-[#6F8BAF] block text-[10px]">Input:</span>
                          <span className="text-[#9DB6D5] truncate block">{tc.input || '(empty)'}</span>
                        </div>
                        <div>
                          <span className="text-[#6F8BAF] block text-[10px]">Expected:</span>
                          <span className="text-emerald-400 truncate block">{tc.expected_output}</span>
                        </div>
                        {runRes && (
                          <div className="col-span-2 pt-1 border-t border-[#123F70]/40">
                            <span className="text-[#6F8BAF] block text-[10px]">Actual Output:</span>
                            <span
                              className={`truncate block ${
                                resStatus === 'PASS' ? 'text-emerald-400' : resStatus === 'ERROR' ? 'text-amber-400' : 'text-rose-400'
                              }`}
                            >
                              {runRes.actual_output}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Test Run Summary Badge */}
            {testRunResult && (
              <div className="p-2.5 rounded-xl bg-[#082344] border border-[#123F70] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {testRunResult.all_passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00D6B2]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FB5575]" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      testRunResult.all_passed ? 'text-[#00D6B2]' : 'text-[#FB5575]'
                    }`}
                  >
                    {testRunResult.all_passed
                      ? 'All Tests Passed'
                      : `${testRunResult.passed_count}/${testRunResult.total_count} Passed`}
                  </span>
                </div>
                {testRunResult.execution_time_ms !== undefined && (
                  <span className="text-[11px] font-mono text-[#9DB6D5]">
                    {testRunResult.execution_time_ms} ms
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Error Banner if API Fails */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FB5575]/15 border border-[#FB5575]/40 text-[#FB5575] text-xs font-mono">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleDebug}
            aria-label="Debug My Code / Find Bugs"
            disabled={isDebugging || !code.trim()}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087CFF] to-[#2563EB] hover:from-[#1D8AFF] hover:to-[#1D4ED8] shadow-glow-blue transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isDebugging ? 'Analyzing AST & Logic...' : 'Find Bugs & Debug Code'}</span>
          </button>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT PANEL: Panel 2 ("Ready to Debug?") or Panel 3 (AI Results Page)   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          
          {!analysisResult ? (
            /* ================================================================= */
            /* Panel 2 (Right): "Ready to Debug?" Initial Illustration Card       */
            /* ================================================================= */
            <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-8 sm:p-12 shadow-xl flex flex-col items-center justify-center text-center space-y-6 min-h-[560px]">
              {/* Hexagon Bot Illustration */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#082344] to-[#06152B] border-2 border-[#22D3EE]/50 flex items-center justify-center shadow-glow-cyan transform rotate-3 hover:rotate-0 transition-transform">
                  <Bot className="w-12 h-12 text-[#22D3EE]" />
                </div>
                <div className="absolute -inset-2 bg-[#087CFF]/20 blur-xl rounded-full pointer-events-none" />
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-bold text-[#F1F7FF] tracking-tight">Ready to Debug?</h3>
                <p className="text-xs text-[#9DB6D5] leading-relaxed">
                  Enter your code and describe the issue to get AI-powered analysis and fixes.
                </p>
                <div className="text-[11px] text-[#6F8BAF] font-mono">
                  Awaiting Code Submission
                </div>
              </div>

              {/* Checklist */}
              <div className="w-full max-w-xs space-y-3 pt-2 text-left">
                <div className="flex items-center space-x-3 text-xs text-[#F1F7FF]">
                  <div className="w-5 h-5 rounded-full bg-[#00D6B2]/20 border border-[#00D6B2] flex items-center justify-center text-[#00D6B2] flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>AI root cause analysis</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-[#F1F7FF]">
                  <div className="w-5 h-5 rounded-full bg-[#00D6B2]/20 border border-[#00D6B2] flex items-center justify-center text-[#00D6B2] flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Smart code suggestions</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-[#F1F7FF]">
                  <div className="w-5 h-5 rounded-full bg-[#00D6B2]/20 border border-[#00D6B2] flex items-center justify-center text-[#00D6B2] flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Test execution & validation</span>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* Panel 3: AI Analysis Results Dashboard                            */
            /* ================================================================= */
            <div className="space-y-4">
              
              {/* Header: AI Analysis Results & Verification Status */}
              <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 flex flex-wrap items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#082344] border border-[#123F70] text-[#22D3EE] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F1F7FF]">AI Analysis Results</h3>
                    <p className="text-[11px] text-[#9DB6D5]">Here's what we found and how to fix it.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <VerificationBadge status={activeVerificationStatus} size="sm" />
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isEditorModified || isRevalidating
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                      : editorHasDefects
                      ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                      : 'bg-[#00D6B2]/15 border border-[#00D6B2]/40 text-[#00D6B2] shadow-glow-teal'
                  }`}>
                    {isEditorModified || isRevalidating ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : editorHasDefects ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00D6B2]" />
                    )}
                    <span>
                      {isEditorModified || isRevalidating
                        ? 'Editor Modified (Unverified)'
                        : editorHasDefects
                        ? `${analysisResult.issues?.length || 0} Issues Detected`
                        : 'Analysis Complete'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Demo Mode / Simulation Alert Banner */}
              {(analysisResult.explanation?.includes('[DEMO') || analysisResult.root_cause?.includes('[DEMO') || analysisResult.explain_like_learning?.includes('[DEMO')) && (
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs shadow-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold tracking-wide uppercase text-[11px] text-amber-400">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono text-[10px]">
                      DEMO SIMULATION
                    </span>
                    <span>Local Multi-Stage Engine (AI Offline Simulation)</span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed font-mono">
                    Deterministic AST & static checks are fully functional. AI explanations are locally simulated for testing and demonstration.
                  </p>
                </div>
              )}

              {/* Validation Status & Fix Note Banner */}
              {isEditorModified ? (
                /* Stale / Modified Editor Banner: replaces stale Fix Validated */
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs font-mono flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold">NOT VERIFIED — Editor modified: </span>
                      <span>Current editor contents have changed since the last analysis and have not been validated. Click &quot;Find Bugs&quot; to re-analyze current editor code.</span>
                    </div>
                    <button
                      onClick={handleDebug}
                      className="px-2.5 py-1 rounded bg-[#087CFF] hover:bg-[#2563EB] text-white text-[11px] font-semibold transition shrink-0 shadow-xs"
                    >
                      Find Bugs
                    </button>
                  </div>
                </div>
              ) : isRevalidating ? (
                /* Re-validating In Flight Banner */
                <div className="p-3 rounded-xl border border-[#087CFF]/40 bg-[#087CFF]/15 text-[#22D3EE] text-xs font-mono flex items-start space-x-2">
                  <RotateCcw className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#22D3EE] animate-spin" />
                  <div className="flex-1">
                    <span className="font-bold">Re-validating Fix: </span>
                    <span>Applying patch to editor and re-running compiler checks...</span>
                  </div>
                </div>
              ) : analysisResult.is_valid_fix === false || analysisResult.verification_status === 'Validation Failed' ? (
                /* Validation Failed Banner */
                <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-300 text-xs font-mono flex items-start space-x-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">
                    <span className="font-bold">
                      {analysisResult.verification_status === 'Partially Fixed' ? 'PARTIALLY FIXED: ' : 'VALIDATION FAILED: '}
                    </span>
                    <span>{analysisResult.validation_note}</span>
                  </div>
                </div>
              ) : editorHasDefects && analysisResult.is_valid_fix && isProposedFixValidated ? (
                /* Proposed Fix Validated Banner (Editor still has defects until Apply Fix) */
                <div className="p-3 rounded-xl border border-[#22D3EE]/30 bg-[#082344] text-[#F1F7FF] text-xs font-mono flex items-start space-x-2 shadow-sm">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#22D3EE]" />
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#22D3EE]">Proposed Fix Validated: </span>
                      <span className="text-[#9DB6D5]">
                        {analysisResult.validation_note?.replace(/^Fix Validated:\s*/i, '') || 'Proposed code passed syntax and static checks cleanly.'}
                      </span>
                      <span className="block text-[11px] text-amber-300/90 mt-0.5">
                        Note: The editor currently contains the original code with defects. Click &quot;Apply Fix&quot; to update editor and revalidate.
                      </span>
                    </div>
                    <button
                      onClick={handleApplyFix}
                      className="px-2.5 py-1 rounded bg-[#087CFF] hover:bg-[#2563EB] text-white text-[11px] font-semibold transition shrink-0 shadow-glow-blue"
                    >
                      Apply Fix
                    </button>
                  </div>
                </div>
              ) : isFixApplied ? (
                /* Fix Validated (Applied & Revalidated) Banner */
                <div className="p-3 rounded-xl border border-[#00D6B2]/40 bg-[#00D6B2]/10 text-[#00D6B2] text-xs font-mono flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#00D6B2]" />
                  <div className="flex-1">
                    <span className="font-bold">Fix Validated (Applied to Editor): </span>
                    <span>{analysisResult.validation_note || 'Complete syntax and static checks passed cleanly on the applied fix.'}</span>
                    <span className="block text-[10px] text-[#00D6B2]/70 mt-0.5">
                      Runtime testing marked PASSED only when test cases execute successfully in the secure sandbox.
                    </span>
                  </div>
                </div>
              ) : (analysisResult.issues?.length === 0 && analysisResult.is_valid_fix) ? (
                /* No Issues in Original Code Banner */
                <div className="p-3 rounded-xl border border-[#22D3EE]/30 bg-[#082344] text-[#F1F7FF] text-xs font-mono flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#22D3EE]" />
                  <div className="flex-1">
                    <span className="font-bold text-[#22D3EE]">No Issues Detected: </span>
                    <span className="text-[#9DB6D5]">{analysisResult.validation_note || 'Syntax and static analysis passed. Algorithmic correctness requires running test cases.'}</span>
                  </div>
                </div>
              ) : null}

              {/* Multi-Stage Validation Breakdown */}
              <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-[#123F70]/60 pb-2 gap-2">
                  <span className="text-xs font-bold text-[#F1F7FF] flex items-center space-x-1.5 font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
                    <span>Multi-Stage Validation Breakdown</span>
                  </span>
                  <span className="text-[10px] text-[#6F8BAF] font-mono">
                    Code Version: {isEditorModified ? 'Current Editor (Modified)' : isFixApplied ? 'Current Editor (Patch Applied)' : 'Current Editor'}
                  </span>
                </div>

                {/* When editor has defects and proposed fix is available, display both code versions clearly separated */}
                {editorHasDefects && correctedCode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                    {/* Version 1: Current Editor / Original Code */}
                    <div className="p-3 rounded-xl bg-[#020817] border border-rose-500/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-[#123F70]/40 pb-1.5">
                        <span className="text-[11px] font-bold text-[#F1F7FF] font-mono">
                          Code Version: Current Editor (Original Code)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#FB5575]/20 text-[#FB5575] border border-[#FB5575]/30">
                          Issues Found in Editor
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="p-2 rounded-lg bg-[#061B35] border border-[#123F70]/70 flex flex-col items-center text-center">
                          <span className="text-[9px] font-semibold text-[#9DB6D5] font-mono uppercase">Syntax Validation</span>
                          <span className={`text-xs font-bold font-mono mt-1 ${
                            editorSyntaxStatus === 'PASSED' ? 'text-[#00D6B2]' : editorSyntaxStatus === 'FAILED' ? 'text-[#FB5575]' : 'text-amber-300'
                          }`}>
                            {editorSyntaxStatus}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#061B35] border border-[#123F70]/70 flex flex-col items-center text-center">
                          <span className="text-[9px] font-semibold text-[#9DB6D5] font-mono uppercase">Static Analysis</span>
                          <span className={`text-xs font-bold font-mono mt-1 ${
                            editorStaticStatus === 'PASSED' ? 'text-[#00D6B2]' : editorStaticStatus === 'WARNINGS' ? 'text-amber-300' : 'text-[#FB5575]'
                          }`}>
                            {editorStaticStatus}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#061B35] border border-[#123F70]/70 flex flex-col items-center text-center">
                          <span className="text-[9px] font-semibold text-[#9DB6D5] font-mono uppercase">Runtime Testing</span>
                          <span className={`text-xs font-bold font-mono mt-1 ${
                            editorRuntimeStatus === 'PASSED' ? 'text-[#00D6B2]' : editorRuntimeStatus === 'FAILED' ? 'text-[#FB5575]' : 'text-amber-300'
                          }`}>
                            {editorRuntimeStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-300/80 font-mono">
                        Contains {analysisResult.issues?.length || 0} defect(s) in editor. Click &quot;Apply Fix&quot; to apply solution.
                      </p>
                    </div>

                    {/* Version 2: Proposed Fix */}
                    <div className="p-3 rounded-xl bg-[#020817] border border-[#22D3EE]/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-[#123F70]/40 pb-1.5">
                        <span className="text-[11px] font-bold text-[#22D3EE] font-mono">
                          Code Version: Proposed Fix
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isProposedFixValidated
                            ? 'bg-[#00D6B2]/20 text-[#00D6B2] border border-[#00D6B2]/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {isProposedFixValidated ? 'Checks Passed Cleanly' : 'Fix Incomplete'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="p-2 rounded-lg bg-[#061B35] border border-[#123F70]/70 flex flex-col items-center text-center">
                          <span className="text-[9px] font-semibold text-[#9DB6D5] font-mono uppercase">Syntax Validation</span>
                          <span className={`text-xs font-bold font-mono mt-1 ${
                            proposedSyntaxStatus === 'PASSED' ? 'text-[#00D6B2]' : proposedSyntaxStatus === 'FAILED' ? 'text-[#FB5575]' : 'text-amber-300'
                          }`}>
                            {proposedSyntaxStatus}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#061B35] border border-[#123F70]/70 flex flex-col items-center text-center">
                          <span className="text-[9px] font-semibold text-[#9DB6D5] font-mono uppercase">Static Analysis</span>
                          <span className={`text-xs font-bold font-mono mt-1 ${
                            proposedStaticStatus === 'PASSED' ? 'text-[#00D6B2]' : proposedStaticStatus === 'WARNINGS' ? 'text-amber-300' : 'text-[#FB5575]'
                          }`}>
                            {proposedStaticStatus}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#061B35] border border-[#123F70]/70 flex flex-col items-center text-center">
                          <span className="text-[9px] font-semibold text-[#9DB6D5] font-mono uppercase">Runtime Testing</span>
                          <span className={`text-xs font-bold font-mono mt-1 ${
                            proposedRuntimeStatus === 'PASSED' ? 'text-[#00D6B2]' : proposedRuntimeStatus === 'FAILED' ? 'text-[#FB5575]' : 'text-amber-300'
                          }`}>
                            {proposedRuntimeStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#9DB6D5]/80 font-mono">
                        {isProposedFixValidated ? 'All compiler and semantic checks passed on proposed fix.' : 'Proposed fix contains residual errors.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Standard Single Version Breakdown (e.g. Fix Applied, Editor Modified, or Clean Code) */
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#020817] border border-[#123F70]/70 flex flex-col items-center text-center">
                      <span className="text-[10px] font-semibold text-[#9DB6D5] font-mono uppercase">Syntax Validation</span>
                      <span className={`text-xs font-bold font-mono mt-1 ${
                        editorSyntaxStatus === 'PASSED' ? 'text-[#00D6B2]' : editorSyntaxStatus === 'FAILED' ? 'text-[#FB5575]' : 'text-amber-300'
                      }`}>
                        {editorSyntaxStatus}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#020817] border border-[#123F70]/70 flex flex-col items-center text-center">
                      <span className="text-[10px] font-semibold text-[#9DB6D5] font-mono uppercase">Static Analysis</span>
                      <span className={`text-xs font-bold font-mono mt-1 ${
                        editorStaticStatus === 'PASSED'
                          ? 'text-[#00D6B2]'
                          : editorStaticStatus === 'WARNINGS'
                          ? 'text-amber-300'
                          : editorStaticStatus === 'FAILED'
                          ? 'text-[#FB5575]'
                          : 'text-amber-300'
                      }`}>
                        {editorStaticStatus}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#020817] border border-[#123F70]/70 flex flex-col items-center text-center">
                      <span className="text-[10px] font-semibold text-[#9DB6D5] font-mono uppercase">Runtime Testing</span>
                      <span className={`text-xs font-bold font-mono mt-1 ${
                        editorRuntimeStatus === 'PASSED'
                          ? 'text-[#00D6B2]'
                          : editorRuntimeStatus === 'FAILED'
                          ? 'text-[#FB5575]'
                          : 'text-amber-300'
                      }`}>
                        {editorRuntimeStatus}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-[#9DB6D5]/80 font-mono leading-relaxed pt-1 border-t border-[#123F70]/40">
                  Notice: Clean syntax validation and dry-run execution confirm the code compiles and runs without crashing, but runtime testing is marked PASSED only when code executes successfully in an isolated sandbox with test cases.
                </p>
              </div>

              {/* Remaining Issues in Proposed Fix (if any) */}
              {analysisResult.remaining_issues && analysisResult.remaining_issues.length > 0 && (
                <div className="rounded-2xl bg-[#061B35] border border-rose-500/50 p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-[#FB5575]" />
                      <span className="text-xs font-bold text-[#FB5575] font-mono">
                        Identified Defects &amp; Findings ({analysisResult.remaining_issues.length}) — Remaining in Proposed Fix
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                        {analysisResult.verification_status === 'Partially Fixed' ? 'PARTIALLY FIXED' : 'VALIDATION FAILED'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.remaining_issues.map((rIss, rIdx) => (
                      <div key={rIss.id || rIdx} className="p-2.5 rounded-xl bg-[#020817] border border-rose-500/30 text-xs font-mono">
                        <div className="flex items-center justify-between text-[11px] text-rose-300 font-bold">
                          <span>[{rIss.category || 'Error'}] {rIss.message}</span>
                          {rIss.line && <span className="text-[#9DB6D5]">Line {rIss.line}</span>}
                        </div>
                        {rIss.explanation && (
                          <p className="text-[10px] text-[#9DB6D5] mt-1 font-sans">{rIss.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Code Findings Section */}
              {(() => {
                const originalIssues = analysisResult.issues || [];
                // Must require fixRevalidated to avoid false "all resolved" display
                const isFixApplied = fixRevalidated && code === analysisResult.corrected_code && analysisResult.is_valid_fix;
                const hasRemaining = Boolean(analysisResult.remaining_issues && analysisResult.remaining_issues.length > 0);

                if ((isFixApplied || originalIssues.length === 0) && !hasRemaining) {
                  return (
                    <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 shadow-md flex items-center space-x-2 text-xs font-mono text-[#00D6B2]">
                      <CheckCircle2 className="w-4 h-4 text-[#00D6B2] flex-shrink-0" />
                      <span>All identified defects resolved in proposed code. No active syntax or static errors remaining.</span>
                    </div>
                  );
                }

                return (
                  <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 shadow-md space-y-3">
                    <div className="flex items-center justify-between border-b border-[#123F70]/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold flex items-center space-x-1.5 text-[#F1F7FF]">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Identified Defects &amp; Findings ({originalIssues.length})</span>
                        </span>
                        {isFixApplied ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                            Resolved in Applied Fix
                          </span>
                        ) : analysisResult.is_valid_fix ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                            Resolved in Proposed Fix
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-[#6F8BAF] font-mono">
                        Click finding to focus editor line
                      </span>
                    </div>

                    {/* Scrollable list of findings */}
                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {originalIssues.map((iss, idx) => {
                        const isSelected = selectedIssueId === iss.id || highlightLine === iss.line;
                        return (
                          <div
                            key={iss.id || idx}
                            onClick={() => handleSelectIssue(iss)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-[#082344] border-[#22D3EE] shadow-glow-cyan' 
                                : 'bg-[#020817] border-[#123F70] hover:border-[#1D8AFF]/60'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#123F70]/40">
                              <div className="flex items-center space-x-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                                  iss.severity === 'error' ? 'bg-[#FB5575]/20 text-[#FB5575] border border-[#FB5575]/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {iss.severity || 'error'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#087CFF]/15 text-[#22D3EE] border border-[#087CFF]/30 font-mono">
                                  {iss.category}
                                </span>
                              </div>

                              {iss.line && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectIssue(iss);
                                  }}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#082344] hover:bg-[#078BFF]/20 text-[#22D3EE] border border-[#123F70] transition"
                                  title="Click to navigate editor to this line"
                                >
                                  <MapPin className="w-3 h-3 text-[#087CFF]" />
                                  <span>Line {iss.line}{iss.column ? `:${iss.column}` : ''}</span>
                                </button>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-[#F1F7FF] mt-1.5 font-mono flex items-start gap-1.5">
                              <span className="text-[#FB5575]">•</span>
                              <span>{iss.message}</span>
                            </h4>

                            {iss.explanation && (
                              <p className="text-[11px] text-[#9DB6D5] mt-1 leading-relaxed pl-3 font-sans">
                                {iss.explanation}
                              </p>
                            )}

                            {iss.suggested_fix && (
                              <div className="mt-2 p-2 rounded-lg bg-[#082344]/80 border border-[#123F70] text-[11px] font-mono text-[#00D6B2] flex items-start space-x-1.5">
                                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#00D6B2]" />
                                <div>
                                  <span className="font-semibold text-[#22D3EE]">Fix Recommendation: </span>
                                  <span>{iss.suggested_fix}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Two Diagnostic Cards (Root Cause & Suggested Fix) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Root Cause Card */}
                <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F1F7FF] flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#087CFF]" />
                      <span>Root Cause</span>
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {analysisResult.affected_line && (
                        <span className="px-2 py-0.5 rounded-full bg-[#087CFF]/20 text-[#22D3EE] text-[10px] font-mono font-semibold">
                          Line {analysisResult.affected_line}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#FB5575]/20 border border-[#FB5575]/40 text-[#FB5575] text-[10px] font-semibold">
                        High Priority
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-[#FB5575] font-mono leading-snug">
                    {analysisResult.detected_issue}
                  </h4>
                  <p className="text-[11px] text-[#9DB6D5] leading-relaxed">
                    {analysisResult.root_cause || analysisResult.explanation}
                  </p>
                </div>

                {/* 2. Suggested Fix Card */}
                <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 space-y-2 shadow-md flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#F1F7FF] flex items-center space-x-1.5">
                      <Code2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Suggested Fix</span>
                    </span>
                    <p className="text-[11px] text-[#9DB6D5] leading-relaxed">
                      {analysisResult.recommended_fix || 'Add a boundary check and return -1 when the target is not found in the array.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => setShowExplanationModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#082344] hover:bg-[#123F70] border border-[#123F70] text-[#22D3EE] text-[11px] font-semibold transition"
                    >
                      View Explanation
                    </button>
                    <button
                      onClick={handleApplyFix}
                      className="px-3 py-1.5 rounded-lg bg-[#087CFF] hover:bg-[#2563EB] text-white text-[11px] font-semibold transition shadow-xs"
                    >
                      Apply Fix
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle: Side-by-Side Original Code vs Fixed Code */}
              <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#123F70]/60 pb-2">
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-[#F1F7FF]">Original Code</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#FB5575]/20 text-[#FB5575] text-[10px] font-mono font-semibold">
                        Buggy
                      </span>
                    </div>
                    <span className="text-[#6F8BAF] font-mono">vs</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-[#F1F7FF]">Fixed Code</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#00D6B2]/20 text-[#00D6B2] text-[10px] font-mono font-semibold">
                        Corrected
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleApplyFix}
                      className="px-2.5 py-1 rounded bg-[#087CFF] hover:bg-[#2563EB] text-white text-[11px] font-semibold transition shadow-xs"
                    >
                      Apply Fix
                    </button>
                    <button
                      onClick={() => handleCopyCode(correctedCode, 'Copy Code')}
                      className="p-1.5 rounded text-slate-400 hover:text-white flex items-center space-x-1 text-xs"
                      title="Copy corrected code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy Code</span>
                    </button>
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="rounded-xl border border-[#123F70] overflow-hidden bg-[#020817]">
                  <DiffViewer
                    originalCode={analyzedCode || code}
                    correctedCode={correctedCode}
                    language={resolvedLanguage}
                    height="260px"
                  />
                </div>
              </div>

              {/* Bottom Card: Test Results */}
              <div className="rounded-2xl bg-[#061B35] border border-[#123F70] p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-[#123F70]/60 pb-2">
                  <span className="text-xs font-bold text-[#F1F7FF] flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#00D6B2]" />
                    <span>Test Results</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#6F8BAF]">
                    {testRunResult ? `${testRunResult.passed_count}/${testRunResult.total_count} Passed` : 'Sandbox Execution'}
                  </span>
                </div>

                {testRunResult ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Left Column: Passed summary */}
                    <div className="md:col-span-5 p-3 rounded-xl bg-[#082344] border border-[#123F70] flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        testRunResult.all_passed ? 'bg-[#00D6B2]/20 border-[#00D6B2] text-[#00D6B2]' : 'bg-[#FB5575]/20 border-[#FB5575] text-[#FB5575]'
                      }`}>
                        {testRunResult.all_passed ? <Check className="w-4 h-4 stroke-[3]" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${testRunResult.all_passed ? 'text-[#00D6B2]' : 'text-[#FB5575]'}`}>
                          {testRunResult.all_passed ? 'All Tests Passed' : `${testRunResult.passed_count}/${testRunResult.total_count} Passed`}
                        </div>
                        <div className="text-[10px] text-[#9DB6D5]">
                          {testRunResult.execution_time_ms ? `${testRunResult.execution_time_ms} ms runtime` : `${testRunResult.passed_count}/${testRunResult.total_count} tests successful`}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Terminal logs / real test cases */}
                    <div className="md:col-span-7 p-3 rounded-xl bg-[#020817] border border-[#123F70] font-mono text-[11px] space-y-1.5 max-h-[140px] overflow-y-auto">
                      {testRunResult.results && testRunResult.results.length > 0 ? (
                        testRunResult.results.map((res, idx) => {
                          const status = res.status || (res.passed ? 'PASS' : 'FAIL');
                          const isPass = status === 'PASS';
                          const isError = status === 'ERROR';
                          return (
                            <div key={idx} className="flex items-center justify-between space-x-2">
                              <span className="truncate max-w-[190px] text-[#F1F7FF]">
                                {res.name || (res.input ? `test(${res.input})` : `test_case_${idx + 1}`)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  isPass
                                    ? 'text-[#00D6B2] bg-emerald-500/10 border border-emerald-500/30'
                                    : isError
                                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                                    : 'text-[#FB5575] bg-rose-500/10 border border-rose-500/30'
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-400">Execution completed with exit code 0.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#082344]/60 border border-[#123F70] flex items-center justify-between text-xs font-mono text-[#9DB6D5]">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Sandbox Tests: Not Executed</span>
                    </div>
                    <span className="text-[10px] text-[#6F8BAF]">Click &quot;Run Tests&quot; in the left panel</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanationModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#061B35] border border-[#123F70] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#123F70] pb-3">
              <h3 className="text-sm font-bold text-[#F1F7FF] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                <span>Explain Like I'm Learning</span>
              </h3>
              <button onClick={() => setShowExplanationModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-xs text-[#F1F7FF] leading-relaxed whitespace-pre-wrap font-sans">
              {analysisResult.explain_like_learning || analysisResult.explanation}
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#087CFF] hover:bg-[#2563EB]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Trials limit */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
