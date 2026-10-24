import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DebuggerPage } from '../pages/DebuggerPage';
import { ToastProvider } from '../components/common/Toast';
import { ApiHealthProvider } from '../context/ApiHealthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import * as debugApi from '../api/debug';
import * as languagesApi from '../api/languages';
import { DebugResponse, ValidateFixResponse } from '../types/api';

// Mock Monaco CodeEditor and DiffViewer to avoid jsdom canvas issues
vi.mock('../components/editor/CodeEditor', () => ({
  CodeEditor: ({ value, onChange, placeholder }: any) => (
    <div data-testid="mock-code-editor">
      <textarea
        data-testid="mock-monaco-textarea"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}));

vi.mock('../components/editor/DiffViewer', () => ({
  DiffViewer: ({ originalCode, correctedCode }: any) => (
    <div data-testid="mock-diff-viewer">
      <pre data-testid="original-diff">{originalCode}</pre>
      <pre data-testid="corrected-diff">{correctedCode}</pre>
    </div>
  ),
}));

const renderDebugger = () => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <ApiHealthProvider>
          <ToastProvider>
            <DebuggerPage />
          </ToastProvider>
        </ApiHealthProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('Validation and Reporting Regression Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('debugdynasty_trials', '2');
    localStorage.setItem('debugdynasty_default_lang', 'python');

    vi.spyOn(debugApi, 'checkHealth').mockResolvedValue({
      status: 'healthy',
      version: '1.0.0',
      sandbox_available: true,
    });

    vi.spyOn(languagesApi, 'getLanguages').mockResolvedValue([
      { id: 'python', name: 'Python', sandbox_supported: true, monaco_id: 'python' },
      { id: 'javascript', name: 'JavaScript', sandbox_supported: false, monaco_id: 'javascript' },
    ]);
  });

  it('Scenario 1: displays multiple syntax error findings and multi-stage status', async () => {
    const multiSyntaxResponse: DebugResponse = {
      detected_issue: 'Multiple syntax errors detected',
      error_category: 'Syntax',
      root_cause: 'Missing colons and unclosed parenthesis',
      affected_line: 1,
      explanation: 'Lines 1 and 4 are missing terminating colons; line 7 has unclosed bracket.',
      recommended_fix: 'Add colons to statement headers and close print parenthesis.',
      corrected_code: 'def calc(vals):\n    for v in vals:\n        print(v)\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Syntax and static semantic checks passed successfully. Note: Algorithmic logic correctness requires running test cases.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT TESTED',
      issues: [
        { id: 'iss-1', line: 1, column: 15, category: 'Syntax', severity: 'error', message: 'Missing colon ":" on def header' },
        { id: 'iss-2', line: 4, column: 18, category: 'Syntax', severity: 'error', message: 'Missing colon ":" on for loop' },
        { id: 'iss-3', line: 7, column: 12, category: 'Syntax', severity: 'error', message: 'Unclosed opening bracket "("' }
      ],
      remaining_issues: []
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(multiSyntaxResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByText(/Identified Defects & Findings \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing colon ":" on def header/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing colon ":" on for loop/i)).toBeInTheDocument();
      expect(screen.getByText(/Unclosed opening bracket "\("/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Fix Validated/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Syntax Validation/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Static Analysis/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Runtime Testing/i).length).toBeGreaterThan(0);
    });
  });

  it('Scenario 2: proposal with remaining syntax error displays VALIDATION FAILED and never Fix Validated', async () => {
    const failedValidationResponse: DebugResponse = {
      detected_issue: 'Syntax Error in proposed fix',
      error_category: 'Syntax',
      root_cause: 'Synthesized proposal still contains residual syntax error',
      affected_line: 1,
      explanation: 'Syntax error remains in corrected code.',
      recommended_fix: 'Manual syntax correction needed',
      corrected_code: 'def broken(:\n    pass\n',
      verification_status: 'Validation Failed',
      is_valid_fix: false,
      validation_note: 'VALIDATION FAILED: Proposed code contains syntax error on line 1: expected identifier.',
      syntax_status: 'FAILED',
      static_analysis_status: 'NOT EVALUATED',
      runtime_status: 'NOT TESTED',
      issues: [
        { id: 'orig-1', line: 1, column: 1, category: 'Syntax', severity: 'error', message: 'Syntax error in original' }
      ],
      remaining_issues: [
        { id: 'err-rem-1', line: 1, column: 12, category: 'Syntax', severity: 'error', message: 'SyntaxError in proposed code: expected identifier' }
      ]
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(failedValidationResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      // Must display VALIDATION FAILED
      expect(screen.getAllByText(/Validation Failed/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/VALIDATION FAILED/i).length).toBeGreaterThan(0);
      // Must NOT display "Fix Validated"
      expect(screen.queryByText(/^Fix Validated$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Fix Validated: /i)).not.toBeInTheDocument();
      // Must show remaining unresolved issue
      expect(screen.getByText(/Remaining in Proposed Fix/i)).toBeInTheDocument();
      expect(screen.getAllByText(/expected identifier/i).length).toBeGreaterThan(0);
      // Syntax status must display FAILED
      expect(screen.getAllByText(/FAILED/i).length).toBeGreaterThan(0);
    });
  });

  it('Scenario 3: fully corrected program shows separate statuses and logic notice', async () => {
    const cleanResponse: DebugResponse = {
      detected_issue: 'No defects detected in source code',
      error_category: 'Logic',
      root_cause: 'Code compiles cleanly',
      affected_line: null,
      explanation: 'Syntax and AST checks passed.',
      recommended_fix: 'Code structure is valid.',
      corrected_code: 'def add(a, b):\n    return a + b\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Syntax and static semantic checks passed successfully. Note: Algorithmic logic correctness requires running test cases.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT TESTED',
      issues: [],
      remaining_issues: []
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(cleanResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByText(/Multi-Stage Validation Breakdown/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Syntax Validation/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Static Analysis/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Runtime Testing/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Notice: Clean syntax validation and dry-run execution/i)).toBeInTheDocument();
    });
  });

  it('Scenario 4: logic error involving negative numbers indicates defect and fix', async () => {
    const logicNegResponse: DebugResponse = {
      detected_issue: 'Found 1 error: Incorrect initialization of maximum variable "max_val" to 0',
      error_category: 'Logic',
      root_cause: 'Initializing max_val to 0 fails when all numbers are negative.',
      affected_line: 2,
      explanation: 'When input is [-10, -25, -5], returning 0 is incorrect since 0 is not in the collection.',
      recommended_fix: 'Initialize max_val from numbers[0] instead of 0.',
      corrected_code: 'def find_max(numbers):\n    if not numbers: return None\n    max_val = numbers[0]\n    for n in numbers:\n        if n > max_val: max_val = n\n    return max_val\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Syntax and static semantic checks passed successfully.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT TESTED',
      issues: [
        {
          id: 'err-logic-1',
          line: 2,
          column: 5,
          category: 'Logic',
          severity: 'error',
          message: 'Incorrect initialization of maximum variable "max_val" to 0',
          explanation: 'Fails for negative number collections [-10, -25, -5]',
          suggested_fix: 'Initialize from numbers[0]'
        }
      ],
      remaining_issues: []
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(logicNegResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Incorrect initialization of maximum variable "max_val" to 0/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Fails for negative number collections/i)).toBeInTheDocument();
    });
  });

  it('Scenario 5: detects editor content modification and shows mismatch warning', async () => {
    const initialResponse: DebugResponse = {
      detected_issue: 'Original version analyzed',
      error_category: 'Syntax',
      root_cause: 'Original syntax',
      affected_line: 1,
      explanation: 'Analysis for original code.',
      recommended_fix: 'Original fix',
      corrected_code: 'def v1_fix(): pass\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Syntax passed.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT TESTED',
      issues: [],
      remaining_issues: []
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(initialResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Original version analyzed/i).length).toBeGreaterThan(0);
    });

    // User modifies editor code to v2 via textarea
    const textarea = screen.getByTestId('mock-monaco-textarea');
    fireEvent.change(textarea, { target: { value: 'def modified_v2(): pass' } });

    // Mismatch banner must be displayed
    await waitFor(() => {
      expect(screen.getByText(/Editor contents modified since last analysis/i)).toBeInTheDocument();
    });
  });

  it('Apply Fix updates editor code and refreshes validation status', async () => {
    const debugResp: DebugResponse = {
      detected_issue: 'Fixable defect',
      error_category: 'Syntax',
      root_cause: 'Missing colon',
      affected_line: 1,
      explanation: 'Colon missing on line 1.',
      recommended_fix: 'Append colon',
      corrected_code: 'def fixed_target():\n    return 42\n',
      verification_status: 'Suggested',
      is_valid_fix: true,
      validation_note: 'Validation pending.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT TESTED',
      issues: [
        { id: 'i-1', line: 1, column: 10, category: 'Syntax', severity: 'error', message: 'Missing colon' }
      ]
    };

    const validateResp: ValidateFixResponse = {
      is_valid: true,
      verification_status: 'Validated',
      validation_details: 'Fix Validated: Target code syntax verified cleanly.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'PASSED',
      remaining_issues: []
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(debugResp);
    vi.spyOn(debugApi, 'validateFix').mockResolvedValueOnce(validateResp);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Apply Fix/i }).length).toBeGreaterThan(0);
    });

    // Click Apply Fix
    const applyBtn = screen.getAllByRole('button', { name: /Apply Fix/i })[0];
    fireEvent.click(applyBtn);

    // Verify editor has updated code and validateFix was triggered
    await waitFor(() => {
      const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('def fixed_target():\n    return 42\n');
      expect(debugApi.validateFix).toHaveBeenCalled();
      expect(screen.getAllByText(/Fix Applied/i).length).toBeGreaterThan(0);
      // Finding list should now reflect that defects are resolved in editor
      expect(screen.getByText(/All identified defects resolved in proposed code/i)).toBeInTheDocument();
    });
  });

  it('Apply Fix with a broken proposal updates editor and displays VALIDATION FAILED with remaining syntax error', async () => {
    const debugResp: DebugResponse = {
      detected_issue: 'Fix with syntax defect',
      error_category: 'Syntax',
      root_cause: 'Syntax problem in proposal',
      affected_line: 1,
      explanation: 'Initial syntax error.',
      recommended_fix: 'Partial fix',
      corrected_code: 'def still_broken(x\n    return x\n',
      verification_status: 'Validation Failed',
      is_valid_fix: false,
      validation_note: 'VALIDATION FAILED: Proposed code contains syntax error on line 1: Missing colon',
      syntax_status: 'FAILED',
      static_analysis_status: 'NOT EVALUATED',
      runtime_status: 'NOT TESTED',
      issues: [
        { id: 'i-1', line: 1, column: 1, category: 'Syntax', severity: 'error', message: 'Original defect' }
      ],
      remaining_issues: [
        { id: 'rem-1', line: 1, column: 18, category: 'Syntax', severity: 'error', message: 'Missing colon ":" on def header' }
      ]
    };

    const validateResp: ValidateFixResponse = {
      is_valid: false,
      verification_status: 'Validation Failed',
      validation_details: 'VALIDATION FAILED: Proposed code contains syntax error on line 1: Missing colon ":" on def header.',
      syntax_status: 'FAILED',
      static_analysis_status: 'NOT EVALUATED',
      runtime_status: 'NOT TESTED',
      remaining_issues: [
        { id: 'rem-1', line: 1, column: 18, category: 'Syntax', severity: 'error', message: 'Missing colon ":" on def header' }
      ]
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(debugResp);
    vi.spyOn(debugApi, 'validateFix').mockResolvedValueOnce(validateResp);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Apply Fix/i }).length).toBeGreaterThan(0);
    });

    // Click Apply Fix
    const applyBtn = screen.getAllByRole('button', { name: /Apply Fix/i })[0];
    fireEvent.click(applyBtn);

    // Verify editor has updated code and status is VALIDATION FAILED, never Fix Validated
    await waitFor(() => {
      const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('def still_broken(x\n    return x\n');
      expect(debugApi.validateFix).toHaveBeenCalled();
      expect(screen.getAllByText(/VALIDATION FAILED/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/^Fix Validated$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Fix Validated: /i)).not.toBeInTheDocument();
      expect(screen.getByText(/Remaining in Proposed Fix/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing colon ":" on def header/i)).toBeInTheDocument();
    });
  });

  it('Scenario 8: stale responses cannot mark newer code as validated when editor is modified', async () => {
    const initialResponse: DebugResponse = {
      detected_issue: 'Found 1 error',
      error_category: 'Syntax',
      root_cause: 'Missing colon',
      affected_line: 1,
      explanation: 'Missing colon',
      recommended_fix: 'Add colon',
      corrected_code: 'def valid():\n    return 1\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Clean syntax.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      issues: [
        {
          id: 'err-1',
          line: 1,
          column: 10,
          category: 'Syntax',
          severity: 'error',
          message: 'Missing colon',
          suggested_fix: 'Add :'
        }
      ]
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(initialResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByText(/Defects Detected/i)).toBeInTheDocument();
    });

    // User now modifies editor code (stale response)
    const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'def modified_code():\n    pass\n' } });

    await waitFor(() => {
      expect(screen.getByText(/Current Editor \(Modified\)/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/NOT VERIFIED — Editor modified/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Not Verified/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Fix Validated: $/i)).not.toBeInTheDocument();
  });

  it('Scenario 9: invalid code in Monaco editor displays Defects Detected and Syntax FAILED until Apply Fix', async () => {
    const defectResponse: DebugResponse = {
      detected_issue: 'Found 1 error: Missing colon',
      error_category: 'Syntax',
      root_cause: 'Missing colon on function definition',
      affected_line: 1,
      explanation: 'Function header requires colon',
      recommended_fix: 'Add colon',
      corrected_code: 'def fixed():\n    return 42\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Proposed code syntax is clean.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      issues: [
        {
          id: 'err-syn',
          line: 1,
          column: 11,
          category: 'Syntax',
          severity: 'error',
          message: 'Missing colon ":" on def header',
          suggested_fix: 'Add :'
        }
      ]
    };

    const validateFixResponse: ValidateFixResponse = {
      is_valid: true,
      verification_status: 'Fix Validated',
      validation_details: 'Fix Validated: Complete Python syntax checks passed cleanly.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      remaining_issues: [],
      runtime_output: { stdout: 'Exit code 0', stderr: '', exit_code: 0 },
      feedback: 'Corrected code is clean.'
    };

    const debugSpy = vi.spyOn(debugApi, 'debugCode').mockResolvedValue(defectResponse);
    vi.spyOn(debugApi, 'validateFix').mockResolvedValue(validateFixResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    await waitFor(() => expect(debugSpy).toHaveBeenCalled());

    await waitFor(() => {
      expect(screen.getByText(/Defects Detected/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Syntax Validation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FAILED/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/NOT RUN/i).length).toBeGreaterThan(0);

    // Now Apply Fix
    const applyBtn = screen.getAllByRole('button', { name: /Apply Fix/i })[0];
    fireEvent.click(applyBtn);

    // Once fix is applied, editor is updated and verified
    await waitFor(() => {
      expect(screen.getByText(/Current Editor \(Patch Applied\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Fix Validated/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PASSED/i).length).toBeGreaterThan(0);
    });
  });

  it('Scenario 10: async response from earlier code cannot mark newer edited code as validated', async () => {
    let resolveDebug!: (val: DebugResponse) => void;
    const pendingPromise = new Promise<DebugResponse>((resolve) => {
      resolveDebug = resolve;
    });

    vi.spyOn(debugApi, 'debugCode').mockReturnValue(pendingPromise);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    // While request is in flight, user modifies editor with new code
    const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'def modified_while_in_flight():\n    pass\n' } });

    // Now the server responds with a "Validated" fix for the OLD code
    const oldCodeResponse: DebugResponse = {
      detected_issue: 'Missing colon in old function',
      error_category: 'Syntax',
      root_cause: 'Missing colon',
      affected_line: 1,
      explanation: 'Missing colon',
      recommended_fix: 'Add colon',
      corrected_code: 'def old_func():\n    return 1\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Clean syntax.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      issues: []
    };

    resolveDebug(oldCodeResponse);

    // The UI must recognize the editor code is modified and NOT display Fix Validated
    await waitFor(() => {
      expect(screen.getAllByText(/NOT VERIFIED — Editor modified/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Not Verified/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/^Fix Validated: $/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Fix Validated \(Applied to Editor\)/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Current Editor \(Modified\)/i)).toBeInTheDocument();
    });

    // All validation breakdown items must remain NOT RUN
    expect(screen.getAllByText(/NOT RUN/i).length).toBeGreaterThanOrEqual(3);
  });

  it('Scenario 11: consistent validation statuses — green Fix Validated is never shown when editor is modified', async () => {
    const validProposalResponse: DebugResponse = {
      detected_issue: 'Missing colon in function',
      error_category: 'Syntax',
      root_cause: 'Missing colon on header',
      affected_line: 1,
      explanation: 'Add colon',
      recommended_fix: 'Add colon',
      corrected_code: 'def clean():\n    return 100\n',
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Fix Validated: Clean syntax.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      issues: [
        {
          id: 'err-c',
          line: 1,
          column: 10,
          category: 'Syntax',
          severity: 'error',
          message: 'Missing colon',
          suggested_fix: 'Add :'
        }
      ]
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValue(validProposalResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => expect(debugBtn).not.toBeDisabled());
    fireEvent.click(debugBtn);

    // Initial state: proposed fix is available, editor code has defects
    await waitFor(() => {
      expect(screen.getByText(/Defects Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Proposed Fix Validated/i)).toBeInTheDocument();
    });

    // Now user modifies editor: enters untested code
    const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'def brand_new_untested_code():\n    pass\n' } });

    // Statuses must all update to NOT VERIFIED / NOT RUN, and green Fix Validated must be completely gone
    await waitFor(() => {
      expect(screen.getAllByText(/NOT VERIFIED — Editor modified/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Not Verified/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/^Fix Validated: $/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Fix Validated \(Applied to Editor\)/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Current Editor \(Modified\)/i)).toBeInTheDocument();
    });

    // Breakdown must show all stages as NOT RUN
    expect(screen.getAllByText(/NOT RUN/i).length).toBeGreaterThanOrEqual(3);
  });

  it('handles empty test cases gracefully by prompting user to add them without crashing', async () => {
    const runTestsSpy = vi.spyOn(debugApi, 'runTests');
    renderDebugger();

    const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'def calculate_discount(price, discount_percent):\n    return price\n' } });

    // Ensure no test cases exist initially
    expect(screen.getByText(/Test Cases \(0\)/i)).toBeInTheDocument();

    const runTestsBtn = screen.getByRole('button', { name: /Run Tests/i });
    fireEvent.click(runTestsBtn);

    // API must NOT be called when no test cases are provided
    expect(runTestsSpy).not.toHaveBeenCalled();

    // Guidance and Add Test Case form must open
    await waitFor(() => {
      expect(screen.getByText(/New Test Case/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Final price: 900\.0/i)).toBeInTheDocument();
    });
  });

  it('allows user to add, edit, and delete test cases through the UI', async () => {
    renderDebugger();

    // Open Add Test Case form
    fireEvent.click(screen.getByRole('button', { name: /Add Test Case/i }));
    expect(screen.getByText(/New Test Case/i)).toBeInTheDocument();

    // Fill in fields
    const nameInput = screen.getByPlaceholderText(/e\.g\. 10% Discount on 1000/i);
    const inputField = screen.getByPlaceholderText(/e\.g\. 1000, 10/i);
    const expectedField = screen.getByPlaceholderText(/e\.g\. Final price: 900\.0/i);

    fireEvent.change(nameInput, { target: { value: '10% Discount Test' } });
    fireEvent.change(inputField, { target: { value: '1000, 10' } });
    fireEvent.change(expectedField, { target: { value: 'Final price: 900.0' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Case/i }));

    // Test case should be in list
    await waitFor(() => {
      expect(screen.getByText(/Test Cases \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('10% Discount Test')).toBeInTheDocument();
      expect(screen.getByText('Final price: 900.0')).toBeInTheDocument();
    });

    // Edit test case
    const editBtn = screen.getByRole('button', { name: /Edit 10% Discount Test/i });
    fireEvent.click(editBtn);
    expect(screen.getByText(/Edit Test Case/i)).toBeInTheDocument();

    const editExpectedField = screen.getByPlaceholderText(/e\.g\. Final price: 900\.0/i);
    fireEvent.change(editExpectedField, { target: { value: 'Final price: 950.0' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Case/i }));

    await waitFor(() => {
      expect(screen.getByText('Final price: 950.0')).toBeInTheDocument();
    });

    // Delete test case
    const deleteBtn = screen.getByRole('button', { name: /Delete 10% Discount Test/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Test Cases \(0\)/i)).toBeInTheDocument();
      expect(screen.queryByText('10% Discount Test')).not.toBeInTheDocument();
    });
  });

  it('displays PASS, FAIL, and ERROR badges with outputs when test cases execute', async () => {
    const runSpy = vi.spyOn(debugApi, 'runTests').mockResolvedValue({
      all_passed: false,
      passed_count: 1,
      total_count: 3,
      verification_status: 'Tests Failed',
      runtime_status: 'FAILED',
      execution_time_ms: 25,
      results: [
        {
          name: 'Discount 10%',
          input: '1000, 10',
          expected_output: 'Final price: 900.0',
          actual_output: 'Final price: 900.0',
          passed: true,
          status: 'PASS',
          execution_time_ms: 8
        },
        {
          name: 'Discount 20%',
          input: '500, 20',
          expected_output: 'Final price: 400.0',
          actual_output: 'Final price: 600.0',
          passed: false,
          status: 'FAIL',
          execution_time_ms: 8
        },
        {
          name: 'Discount Crash',
          input: '0, 0',
          expected_output: 'Final price: 0.0',
          actual_output: 'Error: ZeroDivisionError: division by zero',
          passed: false,
          status: 'ERROR',
          error_message: 'ZeroDivisionError',
          execution_time_ms: 9
        }
      ]
    });

    renderDebugger();

    // Load example which has test cases
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    await waitFor(() => {
      expect(screen.getByText(/Test Cases \(3\)/i)).toBeInTheDocument();
    });

    const runTestsBtn = screen.getByRole('button', { name: /Run Tests/i });
    expect(runTestsBtn).not.toBeDisabled();
    fireEvent.click(runTestsBtn);

    await waitFor(() => {
      expect(runSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getAllByText(/1\/3 Passed/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('PASS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('FAIL').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ERROR').length).toBeGreaterThan(0);
    });
  });

  it('immediately invalidates test run results when editor code is changed', async () => {
    vi.spyOn(debugApi, 'runTests').mockResolvedValue({
      all_passed: true,
      passed_count: 1,
      total_count: 1,
      verification_status: 'Tests Passed',
      runtime_status: 'PASSED',
      execution_time_ms: 12,
      results: [
        {
          name: 'Discount Pass',
          input: '1000, 10',
          expected_output: 'Final price: 900.0',
          actual_output: 'Final price: 900.0',
          passed: true,
          status: 'PASS'
        }
      ]
    });

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    await waitFor(() => {
      expect(screen.getByText(/Test Cases \(3\)/i)).toBeInTheDocument();
    });

    const runTestsBtn = screen.getByRole('button', { name: /Run Tests/i });
    expect(runTestsBtn).not.toBeDisabled();
    fireEvent.click(runTestsBtn);

    await waitFor(() => {
      expect(screen.getByText(/All Tests Passed/i)).toBeInTheDocument();
    });

    // Now edit code
    const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'def modified_code(): pass\n' } });

    // Results must immediately disappear and not claim All Tests Passed
    await waitFor(() => {
      expect(screen.queryByText(/All Tests Passed/i)).not.toBeInTheDocument();
    });
  });

  it('Scenario 16: reproduces and fixes the calculate_sum contradictory validation status by separating code versions', async () => {
    const calculateSumBuggy = 'def calculate_sum(numbers)\n    total = 0\n    for num in numbers\n        total += numbr\n    return total\n';
    const calculateSumFixed = 'def calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total\n';

    const debugResponse: DebugResponse = {
      detected_issue: 'Found 3 errors: Missing colons and undefined variable "numbr"',
      error_category: 'Syntax',
      root_cause: 'Missing colons on function header and for-loop; misspelled variable "numbr" instead of "num"',
      affected_line: 1,
      explanation: 'Lines 1 and 3 lack colons. Line 4 references undefined variable numbr.',
      recommended_fix: 'Add terminating colons and replace numbr with num.',
      corrected_code: calculateSumFixed,
      verification_status: 'Validated',
      is_valid_fix: true,
      validation_note: 'Proposed code passed syntax and static checks cleanly. Algorithmic logic correctness requires running test cases.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      original_syntax_status: 'FAILED',
      original_static_status: 'FAILED',
      original_runtime_status: 'NOT RUN',
      proposed_syntax_status: 'PASSED',
      proposed_static_status: 'PASSED',
      proposed_runtime_status: 'NOT RUN',
      original_validation: {
        code_version: 'Original Code',
        syntax_status: 'FAILED',
        static_analysis_status: 'FAILED',
        runtime_status: 'NOT RUN',
        verification_status: 'Defects Detected',
        issues_count: 3
      },
      proposed_validation: {
        code_version: 'Proposed Fix',
        syntax_status: 'PASSED',
        static_analysis_status: 'PASSED',
        runtime_status: 'NOT RUN',
        verification_status: 'Validated',
        is_valid: true,
        remaining_issues_count: 0
      },
      issues: [
        { id: 'iss-1', line: 1, column: 27, category: 'Syntax', severity: 'error', message: "Missing colon ':' on def header" },
        { id: 'iss-2', line: 3, column: 23, category: 'Syntax', severity: 'error', message: "Missing colon ':' on for loop" },
        { id: 'iss-3', line: 4, column: 18, category: 'Name / Undefined Variable', severity: 'error', message: "Undefined variable or name 'numbr'" }
      ],
      remaining_issues: []
    };

    const validateFixResponse: ValidateFixResponse = {
      is_valid: true,
      verification_status: 'Fix Validated',
      validation_details: 'Complete syntax and static checks passed cleanly on the applied fix.',
      syntax_status: 'PASSED',
      static_analysis_status: 'PASSED',
      runtime_status: 'NOT RUN',
      remaining_issues: [],
      feedback: 'Corrected code is clean.'
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValue(debugResponse);
    vi.spyOn(debugApi, 'validateFix').mockResolvedValue(validateFixResponse);

    renderDebugger();

    // User pastes calculate_sum buggy code into the editor
    const textarea = screen.getByTestId('mock-monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: calculateSumBuggy } });

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    fireEvent.click(debugBtn);

    // Verify initial contradictory condition is resolved through explicit code-version separation:
    await waitFor(() => {
      // 1. Proposed Fix panel displays Proposed Fix Validated
      expect(screen.getByText(/Proposed Fix Validated/i)).toBeInTheDocument();
      // 2. Multi-Stage Validation Breakdown is present
      expect(screen.getByText(/Multi-Stage Validation Breakdown/i)).toBeInTheDocument();
      // 3. Current Editor (Original Code) shows FAILED for syntax & static
      expect(screen.getByText(/Code Version: Current Editor \(Original Code\)/i)).toBeInTheDocument();
      // 4. Proposed Fix shows PASSED for syntax & static
      expect(screen.getByText(/Code Version: Proposed Fix/i)).toBeInTheDocument();
    });

    // Verification of stage statuses in breakdown
    expect(screen.getAllByText(/Syntax Validation/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Static Analysis/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/FAILED/i).length).toBeGreaterThanOrEqual(2); // Editor syntax & static
    expect(screen.getAllByText(/PASSED/i).length).toBeGreaterThanOrEqual(2); // Proposed syntax & static
    expect(screen.getAllByText(/NOT RUN/i).length).toBeGreaterThanOrEqual(2); // Runtime testing not yet run

    // Now click Apply Fix
    const applyBtn = screen.getAllByRole('button', { name: /Apply Fix/i })[0];
    fireEvent.click(applyBtn);

    // Verify Apply Fix updates editor to corrected code, re-validates, and updates status
    await waitFor(() => {
      expect(screen.getByText(/Current Editor \(Patch Applied\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Fix Validated/i).length).toBeGreaterThan(0);
      expect(textarea.value).toBe(calculateSumFixed);
    });
  });
});

