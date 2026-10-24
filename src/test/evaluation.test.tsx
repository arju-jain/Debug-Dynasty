import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvaluationPage } from '../pages/EvaluationPage';
import { ToastProvider } from '../components/common/Toast';
import { ThemeProvider } from '../context/ThemeContext';
import * as evalApi from '../api/evaluation';
import { EvaluationSummary, BenchmarkItem } from '../types/api';

const mockSummary: EvaluationSummary = {
  total_evaluated: 100,
  successful_fixes: 85,
  failed_fixes: 10,
  inconclusive_results: 5,
  fix_success_rate: 85.0,
  execution_success_rate: 80.0,
  by_category: {
    Logic: { total: 40, success: 35, rate: 87.5 },
    Syntax: { total: 30, success: 28, rate: 93.3 },
  },
  by_language: {
    python: { total: 50, success: 45, rate: 90.0 },
    javascript: { total: 50, success: 40, rate: 80.0 },
  },
};

const mockBenchmarks: BenchmarkItem[] = [
  {
    id: 'bm_01',
    name: 'Binary Search Boundary',
    language: 'python',
    category: 'Boundary Condition',
    difficulty: 'Medium',
    original_code: '...',
    expected_fix: '...',
    status: 'Passed',
    execution_time_ms: 15,
  },
];

describe('EvaluationPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders benchmark evaluation metrics and individual test items', async () => {
    vi.spyOn(evalApi, 'getEvaluationSummary').mockResolvedValueOnce(mockSummary);
    vi.spyOn(evalApi, 'getBenchmarkItems').mockResolvedValueOnce(mockBenchmarks);

    render(
      <ThemeProvider>
        <ToastProvider>
          <EvaluationPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText(/Binary Search Boundary/i)).toBeInTheDocument();
      expect(screen.getByText(/Results by Error Category/i)).toBeInTheDocument();
    });
  });

  it('handles CSV report export click', async () => {
    vi.spyOn(evalApi, 'getEvaluationSummary').mockResolvedValueOnce(mockSummary);
    vi.spyOn(evalApi, 'getBenchmarkItems').mockResolvedValueOnce(mockBenchmarks);

    render(
      <ThemeProvider>
        <ToastProvider>
          <EvaluationPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export Report \(CSV\)/i })).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Export Report \(CSV\)/i });
    fireEvent.click(exportBtn);

    // Toast indicates export successful
    await waitFor(() => {
      expect(screen.getByText(/Report Exported/i)).toBeInTheDocument();
    });
  });

  it('displays "No benchmark results available yet." when backend returns no benchmarks', async () => {
    vi.spyOn(evalApi, 'getEvaluationSummary').mockRejectedValueOnce(new Error('Not found'));
    vi.spyOn(evalApi, 'getBenchmarkItems').mockResolvedValueOnce([]);

    render(
      <ThemeProvider>
        <ToastProvider>
          <EvaluationPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No benchmark results available yet\./i)).toBeInTheDocument();
    });
  });
});
