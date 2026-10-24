import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoryPage } from '../pages/HistoryPage';
import { ToastProvider } from '../components/common/Toast';
import { ThemeProvider } from '../context/ThemeContext';
import * as historyApi from '../api/history';

const mockHistoryData = [
  {
    id: 'ses_001',
    timestamp: '2026-10-19T10:00:00Z',
    language: 'python',
    error_description: 'Off by one loop in binary search',
    error_category: 'Boundary Condition' as const,
    original_code: 'def search(): pass',
    corrected_code: 'def search(): return 0',
    verification_status: 'Tests Passed' as const,
    root_cause: 'Index high out of bounds',
  },
  {
    id: 'ses_002',
    timestamp: '2026-10-18T14:30:00Z',
    language: 'javascript',
    error_description: 'Null pointer exception on undefined user',
    error_category: 'Runtime' as const,
    original_code: 'user.profile.name',
    corrected_code: 'user?.profile?.name',
    verification_status: 'Suggested' as const,
    root_cause: 'Unchecked property access',
  },
];

describe('HistoryPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves and displays history sessions', async () => {
    vi.spyOn(historyApi, 'getHistory').mockResolvedValueOnce(mockHistoryData);

    render(
      <ThemeProvider>
        <ToastProvider>
          <HistoryPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Off by one loop in binary search/i)).toBeInTheDocument();
      expect(screen.getByText(/Null pointer exception on undefined user/i)).toBeInTheDocument();
      expect(screen.getByText(/#ses_001/i)).toBeInTheDocument();
    });
  });

  it('filters sessions by search term', async () => {
    vi.spyOn(historyApi, 'getHistory').mockResolvedValueOnce(mockHistoryData);

    render(
      <ThemeProvider>
        <ToastProvider>
          <HistoryPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Off by one loop/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by issue description/i);
    fireEvent.change(searchInput, { target: { value: 'null pointer' } });

    expect(screen.queryByText(/Off by one loop in binary search/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Null pointer exception on undefined user/i)).toBeInTheDocument();
  });

  it('handles session deletion through DELETE /api/history/{id}', async () => {
    vi.spyOn(historyApi, 'getHistory').mockResolvedValueOnce(mockHistoryData);
    const deleteSpy = vi.spyOn(historyApi, 'deleteHistorySession').mockResolvedValueOnce({ success: true });

    render(
      <ThemeProvider>
        <ToastProvider>
          <HistoryPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/#ses_001/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Delete session record/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('ses_001');
    });
  });

  it('shows empty state when no history records exist', async () => {
    vi.spyOn(historyApi, 'getHistory').mockResolvedValueOnce([]);

    render(
      <ThemeProvider>
        <ToastProvider>
          <HistoryPage />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Debugging Sessions Found/i)).toBeInTheDocument();
    });
  });
});
