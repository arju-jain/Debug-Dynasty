import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebuggerPage } from '../pages/DebuggerPage';
import { ApiHealthProvider } from '../context/ApiHealthContext';
import { ToastProvider } from '../components/common/Toast';
import { ThemeProvider } from '../context/ThemeContext';
import * as debugApi from '../api/debug';
import * as langApi from '../api/languages';
import { DebugResponse, RunTestsResponse } from '../types/api';

import { AuthProvider } from '../context/AuthContext';

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

describe('DebuggerPage Workspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(debugApi, 'checkHealth').mockResolvedValue({
      status: 'healthy',
      version: '1.0.0',
      sandbox_available: true,
    });
    vi.spyOn(langApi, 'getLanguages').mockResolvedValue(langApi.DEFAULT_LANGUAGES);
  });

  it('renders workspace with language selector and initial empty state', () => {
    renderDebugger();

    expect(screen.getByText(/AI Coding Debugger/i)).toBeInTheDocument();
    expect(screen.getByText(/Debug Dynasty/i)).toBeInTheDocument();
    expect(screen.getByText(/Code Input/i)).toBeInTheDocument();
    expect(screen.getByText(/Awaiting Code Submission/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Debug My Code/i })).toBeInTheDocument();
  });

  it('loads example code when clicking "Load Example"', async () => {
    renderDebugger();

    const loadExampleBtn = screen.getByRole('button', { name: /Load Example/i });
    fireEvent.click(loadExampleBtn);

    await waitFor(() => {
      const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
      expect(debugBtn).not.toBeDisabled();
    });
  });

  it('displays loading state and handles successful debug submission', async () => {
    const mockResponse: DebugResponse = {
      session_id: 'test_session_123',
      detected_issue: 'Off-by-one boundary loop error',
      error_category: 'Boundary Condition',
      root_cause: 'Loop condition was <= instead of <',
      affected_line: 4,
      explanation: 'The loop extends past the end of the list causing IndexError.',
      recommended_fix: 'Change <= to < in the while statement',
      corrected_code: 'def test(): return True\n',
      assumptions_and_uncertainty: ['Assuming valid array input'],
      suggested_additional_tests: [{ input: '[]', expected_output: 'True' }],
      verification_status: 'Suggested',
      explain_like_learning: 'Imagine counting items on your fingers...',
      quality_suggestions: ['Add type annotations'],
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(mockResponse);

    renderDebugger();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Off-by-one boundary loop error/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Loop condition was <= instead of </i)).toBeInTheDocument();
      expect(screen.getByText(/Line 4/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Suggested \(Unverified\)/i)).toBeInTheDocument();
    });
  });

  it('handles backend debug API failure and shows understandable error message', async () => {
    vi.spyOn(debugApi, 'debugCode').mockRejectedValueOnce(
      new Error('FastAPI server connection refused on port 8000')
    );

    renderDebugger();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/FastAPI server connection refused on port 8000/i).length).toBeGreaterThan(0);
    });
  });

  it('handles "Apply Fix" button replacing source code', async () => {
    const mockResponse: DebugResponse = {
      detected_issue: 'Syntax Error',
      error_category: 'Syntax',
      root_cause: 'Missing colon',
      affected_line: 1,
      explanation: 'Add colon at end of statement',
      recommended_fix: 'Add colon',
      corrected_code: 'def fixed_function(): pass\n',
      verification_status: 'Suggested',
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(mockResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Apply Fix/i }).length).toBeGreaterThan(0);
    });

    const applyFixBtn = screen.getAllByRole('button', { name: /Apply Fix/i })[0];
    fireEvent.click(applyFixBtn);

    expect(screen.getByText(/Fix Applied/i)).toBeInTheDocument();
  });

  it('handles "Copy Code" button triggering clipboard', async () => {
    const mockResponse: DebugResponse = {
      detected_issue: 'Logic issue',
      error_category: 'Logic',
      root_cause: 'Subtraction instead of addition',
      affected_line: 2,
      explanation: 'Use +',
      recommended_fix: 'Use +',
      corrected_code: 'def add(a, b): return a + b\n',
      verification_status: 'Suggested',
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(mockResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByTitle(/Copy corrected code/i)).toBeInTheDocument();
    });

    const copyBtn = screen.getByTitle(/Copy corrected code/i);
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('def add(a, b): return a + b\n');
  });

  it('handles "Run Tests" execution in isolated runner', async () => {
    const mockRunResponse: RunTestsResponse = {
      all_passed: true,
      passed_count: 2,
      total_count: 2,
      verification_status: 'Tests Passed',
      results: [
        { input: '1', expected_output: 'False', actual_output: 'False', passed: true },
        { input: '4', expected_output: 'False', actual_output: 'False', passed: true },
      ],
      execution_time_ms: 18,
    };

    vi.spyOn(debugApi, 'runTests').mockResolvedValueOnce(mockRunResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const runTestsBtn = screen.getByRole('button', { name: /Run Tests/i });
    await waitFor(() => {
      expect(runTestsBtn).not.toBeDisabled();
    });

    fireEvent.click(runTestsBtn);

    await waitFor(() => {
      expect(screen.getByText(/All Tests Passed/i)).toBeInTheDocument();
    });
  });

  it('warns user when running tests on unsupported execution language', async () => {
    renderDebugger();

    // Select C++
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cpp' } });

    await waitFor(() => {
      expect(screen.getByText(/Static Analysis Only/i)).toBeInTheDocument();
    });

    // Load example for cpp so code and test cases are populated
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    await waitFor(() => {
      expect(screen.getByText(/Test Cases \(1\)/i)).toBeInTheDocument();
    });

    const runTestsBtn = screen.getByRole('button', { name: /Run Tests/i });
    await waitFor(() => {
      expect(runTestsBtn).not.toBeDisabled();
    });

    fireEvent.click(runTestsBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Sandbox Execution Unavailable/i).length).toBeGreaterThan(0);
    });
  });

  it('renders multiple detected issues list with line pills and category badges', async () => {
    const multiIssueResponse: DebugResponse = {
      detected_issue: 'Syntax Error (Line 1): Missing colon; Syntax Error (Line 3): Unclosed bracket',
      error_category: 'Syntax',
      root_cause: 'Multiple syntax defects found across lines 1 and 3',
      affected_line: 1,
      explanation: 'Found 2 errors in total.',
      recommended_fix: 'Add colon and close bracket',
      corrected_code: 'def calculate(total):\n    val = [1, 2, 3]\n    return sum(val)\n',
      verification_status: 'Fix Validated',
      is_valid_fix: true,
      validation_note: 'AST parsing succeeded; isolated execution passed without runtime exceptions',
      issues: [
        {
          id: 'issue-1',
          line: 1,
          column: 21,
          category: 'Syntax',
          severity: 'error',
          message: 'Missing colon ":" at the end of statement header',
          explanation: 'Function definitions in Python must end with a colon.',
          suggested_fix: 'Add ":" at line 1',
          confidence: 'high',
          fixable: true,
        },
        {
          id: 'issue-2',
          line: 2,
          column: 11,
          category: 'Syntax',
          severity: 'error',
          message: "Unclosed '[' opened on line 2",
          explanation: 'Every opening bracket must have a matching closing bracket.',
          suggested_fix: "Close '[' with ']'",
          confidence: 'high',
          fixable: true,
        },
      ],
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(multiIssueResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });
    fireEvent.click(debugBtn);

    await waitFor(() => {
      // Check total findings pill
      expect(screen.getByText(/Identified Defects & Findings \(2\)/i)).toBeInTheDocument();
      // Check both individual issues rendered
      expect(screen.getByText(/Missing colon ":" at the end of statement header/i)).toBeInTheDocument();
      expect(screen.getByText(/Unclosed '\[' opened on line 2/i)).toBeInTheDocument();
      // Check fix validated badge
      expect(screen.getAllByText(/Fix Validated/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/AST parsing succeeded; isolated execution passed without runtime exceptions/i)).toBeInTheDocument();
    });

    // Clicking an issue card triggers line navigation
    const firstIssueCard = screen.getByText(/Missing colon ":" at the end of statement header/i).closest('div');
    if (firstIssueCard) {
      fireEvent.click(firstIssueCard);
    }
  });

  it('displays validation failure warning when fix fails validation', async () => {
    const invalidFixResponse: DebugResponse = {
      detected_issue: 'Fix validation failed',
      error_category: 'Syntax',
      root_cause: 'Code could not be safely repaired',
      affected_line: 1,
      explanation: 'Analysis completed with residual errors.',
      recommended_fix: 'Manual inspection required',
      corrected_code: 'def invalid(:\n',
      verification_status: 'Validation Failed',
      is_valid_fix: false,
      validation_note: 'Synthesized fix still contains residual syntax error',
      issues: [
        {
          id: 'issue-1',
          line: 1,
          column: 13,
          category: 'Syntax',
          severity: 'error',
          message: 'Residual syntax error in code',
          explanation: 'Residual syntax error in code',
          confidence: 'high',
          fixable: false,
        },
      ],
    };

    vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(invalidFixResponse);

    renderDebugger();
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Validation Failed/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Synthesized fix still contains residual syntax error/i)).toBeInTheDocument();
    });
  });
});

