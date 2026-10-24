import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebuggerPage } from '../pages/DebuggerPage';
import { ApiHealthProvider } from '../context/ApiHealthContext';
import { ToastProvider } from '../components/common/Toast';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import * as debugApi from '../api/debug';
import * as langApi from '../api/languages';
import { DebugResponse } from '../types/api';

const renderDebuggerWorkspace = () => {
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

const mockSampleDebugResponse: DebugResponse = {
  session_id: 'test_session_sample',
  detected_issue: 'Loop boundary index error',
  error_category: 'Boundary Condition',
  root_cause: 'Loop boundary index was off by one',
  affected_line: 2,
  explanation: 'Boundary condition exceeded array length.',
  recommended_fix: 'Adjust range boundary',
  corrected_code: 'def process(items):\n    return len(items)\n',
  verification_status: 'Validated',
  is_valid_fix: true,
  validation_note: 'AST parsing verified successfully.',
  issues: [
    {
      id: 'iss-1',
      line: 2,
      column: 5,
      category: 'Boundary Condition',
      severity: 'error',
      message: 'Boundary condition exceeded array length',
      explanation: 'Array index was out of bounds',
      confidence: 'high',
      fixable: true,
    },
  ],
};

describe('Authentication & Free Trials Regression Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    vi.spyOn(debugApi, 'checkHealth').mockResolvedValue({
      status: 'healthy',
      version: '1.0.0',
      sandbox_available: true,
    });
    vi.spyOn(langApi, 'getLanguages').mockResolvedValue(langApi.DEFAULT_LANGUAGES);
  });

  // Test 1: Anonymous page access does NOT open the authentication modal
  it('Requirement 1: Anonymous user can open Debugger page without modal automatically appearing', () => {
    renderDebuggerWorkspace();

    // Verify main page elements render
    expect(screen.getByText(/AI Coding Debugger/i)).toBeInTheDocument();
    expect(screen.getByText(/Free trials remaining:/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();

    // Verify authentication modal is NOT displayed
    expect(screen.queryByLabelText(/Close authentication modal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instant Hackathon Demo Sign-In/i)).not.toBeInTheDocument();
  });

  // Test 2: First trial succeeds without login and decrements remaining trials to 1
  it('Requirement 2 & 3: First successful debugging trial succeeds without login and consumes one trial', async () => {
    const debugSpy = vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(mockSampleDebugResponse);

    renderDebuggerWorkspace();

    // Load example code
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));

    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    // Execute first trial
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(debugSpy).toHaveBeenCalledTimes(1);
      // Trial counter decrements from 2 to 1
      expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();
      // Modal should remain closed
      expect(screen.queryByLabelText(/Close authentication modal/i)).not.toBeInTheDocument();
      // Diagnosis results appear
      expect(screen.getAllByText(/Loop boundary index error/i).length).toBeGreaterThan(0);
    });

    expect(localStorage.getItem('debugdynasty_trials')).toBe('1');
  });

  // Test 3: Second trial succeeds without login and decrements remaining trials to 0
  it('Requirement 3: Second successful debugging trial succeeds without login and consumes second trial', async () => {
    localStorage.setItem('debugdynasty_trials', '1');
    const debugSpy = vi.spyOn(debugApi, 'debugCode').mockResolvedValueOnce(mockSampleDebugResponse);

    renderDebuggerWorkspace();

    expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    // Execute second trial
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(debugSpy).toHaveBeenCalledTimes(1);
      // Trial counter decrements from 1 to 0
      expect(screen.getByText(/0 of 2/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Close authentication modal/i)).not.toBeInTheDocument();
    });

    expect(localStorage.getItem('debugdynasty_trials')).toBe('0');
  });

  // Test 4: Third trial requires login and opens the authentication modal
  it('Requirement 4: Third trial attempt is blocked and opens the authentication modal', async () => {
    localStorage.setItem('debugdynasty_trials', '0');
    const debugSpy = vi.spyOn(debugApi, 'debugCode');

    renderDebuggerWorkspace();

    expect(screen.getByText(/0 of 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    // Attempt third trial
    fireEvent.click(debugBtn);

    await waitFor(() => {
      // Debug API must NOT be called
      expect(debugSpy).not.toHaveBeenCalled();
      // Auth modal must be open
      expect(screen.getByLabelText(/Close authentication modal/i)).toBeInTheDocument();
      expect(screen.getByText(/Instant Hackathon Demo Sign-In/i)).toBeInTheDocument();
      expect(screen.getByText(/Free Trials Used/i)).toBeInTheDocument();
    });
  });

  // Test 5: Close (X) button dismisses the modal and user can access the Debugger page
  it('Requirement 2 & 5: Close (X) button dismisses the authentication modal', async () => {
    localStorage.setItem('debugdynasty_trials', '0');
    renderDebuggerWorkspace();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    // Trigger modal by attempting 3rd trial
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Close authentication modal/i)).toBeInTheDocument();
    });

    // Click close (X) button
    const closeBtn = screen.getByLabelText(/Close authentication modal/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      // Modal is dismissed
      expect(screen.queryByLabelText(/Close authentication modal/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Instant Hackathon Demo Sign-In/i)).not.toBeInTheDocument();
      // Debugger workspace remains accessible
      expect(screen.getByText(/AI Coding Debugger/i)).toBeInTheDocument();
    });
  });

  // Test 6: Failed requests or network errors do NOT consume a free trial
  it('Requirement 5: Failed request / network error does NOT consume a free trial', async () => {
    localStorage.setItem('debugdynasty_trials', '2');
    vi.spyOn(debugApi, 'debugCode').mockRejectedValueOnce(new Error('Network Error: Server down'));

    renderDebuggerWorkspace();

    expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    fireEvent.click(debugBtn);

    await waitFor(() => {
      // Error message displayed
      expect(screen.getAllByText(/Network Error: Server down/i).length).toBeGreaterThan(0);
      // Trials remaining must STILL be 2 of 2
      expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('debugdynasty_trials')).toBe('2');
  });

  // Test 7: Successful Instant Hackathon Demo Sign-In logs in and allows unlimited debugging
  it('Requirement 6 & 7: Instant Hackathon Demo Sign-In succeeds, closes modal, and unlocks debugging', async () => {
    localStorage.setItem('debugdynasty_trials', '0');
    const debugSpy = vi.spyOn(debugApi, 'debugCode').mockResolvedValue(mockSampleDebugResponse);

    renderDebuggerWorkspace();

    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });

    // Trigger modal
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByText(/Instant Hackathon Demo Sign-In/i)).toBeInTheDocument();
    });

    // Click Instant Hackathon Demo Sign-In
    const demoBtn = screen.getByText(/Instant Hackathon Demo Sign-In/i);
    fireEvent.click(demoBtn);

    await waitFor(() => {
      // Modal dismissed
      expect(screen.queryByLabelText(/Close authentication modal/i)).not.toBeInTheDocument();
      // User is authenticated
      expect(localStorage.getItem('debugdynasty_user')).toContain('Alex Chen');
      expect(localStorage.getItem('debugdynasty_token')).toBe('dynasty_tok_demo_alexchen_2026');
    });

    // Now debugging can proceed without trial blocking
    const activeDebugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    fireEvent.click(activeDebugBtn);

    await waitFor(() => {
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(screen.getAllByText(/Loop boundary index error/i).length).toBeGreaterThan(0);
    });
  });

  // Test 8: Safe reset command window.resetDynastyTrials resets localStorage and reactive state
  it('Requirement 8: window.resetDynastyTrials() resets trial counter and updates UI reactively', async () => {
    localStorage.setItem('debugdynasty_trials', '0');

    renderDebuggerWorkspace();

    expect(screen.getByText(/0 of 2/i)).toBeInTheDocument();

    // Call window.resetDynastyTrials()
    expect(typeof (window as any).resetDynastyTrials).toBe('function');
    (window as any).resetDynastyTrials();

    // Local storage should now be 2
    expect(localStorage.getItem('debugdynasty_trials')).toBe('2');

    // UI should reactively update to '2 of 2'
    await waitFor(() => {
      expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();
    });
  });

  // Test 9: Dev mode reset button in modal resets trials and closes modal
  it('Requirement 9: Dev mode reset button resets trial count', async () => {
    localStorage.setItem('debugdynasty_trials', '0');

    renderDebuggerWorkspace();

    // Trigger modal by attempting 3rd trial
    fireEvent.click(screen.getByRole('button', { name: /Load Example/i }));
    const debugBtn = screen.getByRole('button', { name: /Debug My Code/i });
    await waitFor(() => {
      expect(debugBtn).not.toBeDisabled();
    });
    fireEvent.click(debugBtn);

    await waitFor(() => {
      expect(screen.getByText(/\[Dev Mode\] Reset Anonymous Free Trials/i)).toBeInTheDocument();
    });

    // Click Dev Mode Reset
    const devResetBtn = screen.getByText(/\[Dev Mode\] Reset Anonymous Free Trials/i);
    fireEvent.click(devResetBtn);

    await waitFor(() => {
      expect(localStorage.getItem('debugdynasty_trials')).toBe('2');
      expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Close authentication modal/i)).not.toBeInTheDocument();
    });
  });
});
