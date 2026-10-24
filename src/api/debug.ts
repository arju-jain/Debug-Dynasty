import { apiClient } from './client';
import { 
  ApiHealth, 
  DebugRequest, 
  DebugResponse, 
  ErrorCategory, 
  RunTestsRequest, 
  RunTestsResponse, 
  ValidateFixRequest, 
  ValidateFixResponse,
  VerificationStatus
} from '../types/api';

function normalizeVerificationStatus(rawStatus?: string): VerificationStatus {
  if (!rawStatus) return 'Not Verified';
  const s = rawStatus.toLowerCase().replace(/_/g, ' ').trim();
  if (s === 'tests passed' || s === 'passed') return 'Tests Passed';
  if (s === 'tests failed' || s === 'failed') return 'Tests Failed';
  if (s === 'fix validated') return 'Fix Validated';
  if (s === 'validated' || s === 'syntax verified') return 'Validated';
  if (s === 'partially fixed') return 'Partially Fixed';
  if (s === 'validation failed') return 'Validation Failed';
  if (s === 'not runtime tested') return 'Not Runtime Tested';
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

export const checkHealth = async (): Promise<ApiHealth> => {
  const data = await apiClient.get<Record<string, any>>('/api/health');
  const components = data.components || {};
  const sandboxAvailable = 
    data.sandbox_available !== undefined
      ? Boolean(data.sandbox_available)
      : components.sandbox?.status === 'healthy';

  return {
    status: data.status || 'ok',
    version: data.version || data.api_version || '1.0.0',
    sandbox_available: sandboxAvailable,
    message: data.message || `Backend is ${data.status || 'healthy'}`
  };
};

export const debugCode = async (data: DebugRequest): Promise<DebugResponse> => {
  const raw = await apiClient.post<Record<string, any>>('/api/debug', data);

  const errorCategory = raw.error_category 
    ? (raw.error_category as ErrorCategory)
    : normalizeErrorCategory(raw.error_type);

  const affectedLine = raw.affected_line !== undefined && raw.affected_line !== null
    ? raw.affected_line
    : (Array.isArray(raw.changes) && raw.changes.length > 0 ? raw.changes[0].line : null);

  return {
    session_id: raw.session_id,
    analyzed_code: raw.analyzed_code || data.code,
    detected_issue: raw.detected_issue || raw.root_cause || 'Issue detected in source code',
    error_category: errorCategory,
    root_cause: raw.root_cause || '',
    affected_line: affectedLine,
    explanation: raw.explanation || '',
    recommended_fix: raw.recommended_fix || raw.explanation || '',
    corrected_code: raw.corrected_code || data.code,
    issues: Array.isArray(raw.issues) ? raw.issues : [],
    remaining_issues: Array.isArray(raw.remaining_issues) ? raw.remaining_issues : [],
    is_valid_fix: raw.is_valid_fix !== undefined ? Boolean(raw.is_valid_fix) : true,
    validation_note: raw.validation_note || '',
    syntax_status: raw.syntax_status,
    static_analysis_status: raw.static_analysis_status,
    runtime_status: raw.runtime_status,
    original_validation: raw.original_validation,
    proposed_validation: raw.proposed_validation,
    original_syntax_status: raw.original_syntax_status,
    original_static_status: raw.original_static_status,
    original_runtime_status: raw.original_runtime_status,
    proposed_syntax_status: raw.proposed_syntax_status,
    proposed_static_status: raw.proposed_static_status,
    proposed_runtime_status: raw.proposed_runtime_status,
    assumptions_and_uncertainty: raw.assumptions_and_uncertainty || raw.assumptions || [],
    suggested_additional_tests: raw.suggested_additional_tests || raw.suggested_tests || [],
    explain_like_learning: raw.explain_like_learning,
    quality_suggestions: raw.quality_suggestions,
    verification_status: normalizeVerificationStatus(raw.verification_status),
    trials_remaining: typeof raw.trials_remaining === 'number' ? raw.trials_remaining : undefined,
    execution_result: raw.execution_result
  };
};

export const validateFix = async (data: ValidateFixRequest): Promise<ValidateFixResponse> => {
  const raw = await apiClient.post<Record<string, any>>('/api/validate-fix', data);

  const isValid = raw.is_valid !== undefined 
    ? Boolean(raw.is_valid) 
    : Boolean(raw.valid);

  const status = normalizeVerificationStatus(raw.verification_status);

  return {
    is_valid: isValid,
    verification_status: status,
    validation_details: raw.validation_details || raw.validation_note || raw.message || (isValid ? 'Syntax validation passed' : 'Validation failed'),
    syntax_status: raw.syntax_status,
    static_analysis_status: raw.static_analysis_status,
    runtime_status: raw.runtime_status,
    remaining_issues: Array.isArray(raw.remaining_issues) ? raw.remaining_issues : [],
    feedback: raw.feedback || raw.message,
    runtime_output: raw.runtime_output
  };
};

export const runTests = async (data: RunTestsRequest): Promise<RunTestsResponse> => {
  const raw = await apiClient.post<Record<string, any>>('/api/run-tests', data);

  const rawResults = raw.results || raw.test_results || [];
  const passedCount = raw.passed_count ?? rawResults.filter((r: any) => r.passed).length;
  const totalCount = raw.total_count ?? rawResults.length;
  const allPassed = raw.all_passed !== undefined 
    ? Boolean(raw.all_passed) 
    : (totalCount > 0 && passedCount === totalCount);

  const results = rawResults.map((r: any) => ({
    name: r.name || '',
    input: r.input || '',
    expected_output: r.expected_output || '',
    actual_output: r.actual_output ?? (r.passed ? r.expected_output : ''),
    passed: Boolean(r.passed),
    status: r.status || (r.passed ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL' | 'ERROR',
    error_message: r.error_message,
    execution_time_ms: r.execution_time_ms
  }));

  const verificationStatus: VerificationStatus = allPassed ? 'Tests Passed' : 'Tests Failed';

  return {
    all_passed: allPassed,
    passed_count: passedCount,
    total_count: totalCount,
    results,
    execution_time_ms: raw.execution_time_ms,
    verification_status: verificationStatus,
    runtime_status: raw.runtime_status
  };
};
