import { apiClient } from './client';
import { ErrorCategory, HistorySession, VerificationStatus } from '../types/api';

function normalizeVerificationStatus(rawStatus?: string): VerificationStatus {
  if (!rawStatus) return 'Not Verified';
  const s = rawStatus.toLowerCase().replace(/_/g, ' ').trim();
  if (s === 'tests passed' || s === 'passed') return 'Tests Passed';
  if (s === 'tests failed' || s === 'failed') return 'Tests Failed';
  if (s === 'validated' || s === 'syntax verified') return 'Validated';
  if (s === 'suggested') return 'Suggested';
  return 'Not Verified';
}

function normalizeErrorCategory(rawType?: string): ErrorCategory {
  if (!rawType) return 'Logic';
  const t = rawType.toLowerCase().replace(/_/g, ' ').trim();
  if (t.includes('syntax')) return 'Syntax';
  if (t.includes('runtime')) return 'Runtime';
  if (t.includes('type')) return 'Type';
  if (t.includes('boundary')) return 'Boundary Condition';
  if (t.includes('logic')) return 'Logic';
  return 'Logic';
}

export const getHistory = async (): Promise<HistorySession[]> => {
  const response = await apiClient.get<any>('/api/history');
  let rawList: any[] = [];

  if (Array.isArray(response)) {
    rawList = response;
  } else if (response && Array.isArray(response.items)) {
    rawList = response.items;
  } else if (response && Array.isArray(response.sessions)) {
    rawList = response.sessions;
  }

  return rawList.map((item: any) => ({
    id: item.id || item.session_id || '',
    timestamp: item.timestamp || (item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString()),
    language: item.language || 'python',
    error_description: item.error_description || '',
    error_category: item.error_category || normalizeErrorCategory(item.error_type),
    original_code: item.original_code || '',
    corrected_code: item.corrected_code || item.proposed_correction || '',
    verification_status: normalizeVerificationStatus(item.verification_status),
    status: item.status,
    root_cause: item.root_cause
  }));
};

export const deleteHistorySession = async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
  return apiClient.delete<{ success: boolean; message?: string }>(`/api/history/${sessionId}`);
};
