export type VerificationStatus = 
  | 'Suggested' 
  | 'Validated' 
  | 'Fix Validated'
  | 'Partially Fixed'
  | 'Validation Failed'
  | 'Defects Detected'
  | 'Not Runtime Tested'
  | 'Tests Passed' 
  | 'Tests Failed' 
  | 'Not Verified';

export type ErrorCategory = 
  | 'Syntax' 
  | 'Runtime' 
  | 'Logic' 
  | 'Type' 
  | 'Boundary Condition' 
  | 'Unknown';

export interface Issue {
  id: string;
  line: number | null;
  column: number | null;
  end_line?: number | null;
  end_column?: number | null;
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  explanation?: string;
  suggested_fix?: string;
  source?: 'deterministic' | 'static_analysis' | 'runtime' | 'ai';
  confidence?: string;
  fixable?: boolean;
}

export interface TestCase {
  id?: string;
  name?: string;
  input: string;
  expected_output: string;
}

export interface TestCaseResult {
  name?: string;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  status?: 'PASS' | 'FAIL' | 'ERROR';
  error_message?: string;
  execution_time_ms?: number;
}

export interface DebugRequest {
  language: string;
  code: string;
  error_description: string;
  expected_behavior: string;
  stdin?: string;
  test_cases?: TestCase[];
}

export interface CodeValidationSummary {
  code_version: string;
  syntax_status: string;
  static_analysis_status: string;
  runtime_status: string;
  verification_status?: string;
  is_valid?: boolean;
  validation_note?: string;
  issues_count?: number;
  remaining_issues_count?: number;
}

export interface DebugResponse {
  session_id?: string;
  analyzed_code?: string;
  detected_issue: string;
  error_category: ErrorCategory;
  root_cause: string;
  affected_line: number | null;
  explanation: string;
  recommended_fix: string;
  corrected_code: string;
  issues?: Issue[];
  remaining_issues?: Issue[];
  original_issues?: Issue[];
  is_valid_fix?: boolean;
  validation_note?: string;
  syntax_status?: string;
  static_analysis_status?: string;
  runtime_status?: string;
  original_validation?: CodeValidationSummary;
  proposed_validation?: CodeValidationSummary;
  original_syntax_status?: string;
  original_static_status?: string;
  original_runtime_status?: string;
  proposed_syntax_status?: string;
  proposed_static_status?: string;
  proposed_runtime_status?: string;
  assumptions_and_uncertainty?: string[] | string;
  suggested_additional_tests?: TestCase[];
  explain_like_learning?: string;
  quality_suggestions?: string[];
  verification_status: VerificationStatus;
  trials_remaining?: number;
  execution_result?: {
    stdout?: string;
    stderr?: string;
    exit_code?: number;
    execution_time_ms?: number;
  };
}

export interface ValidateFixRequest {
  language: string;
  original_code: string;
  corrected_code: string;
  expected_behavior?: string;
}

export interface ValidateFixResponse {
  is_valid: boolean;
  verification_status: VerificationStatus;
  validation_details: string;
  syntax_status?: string;
  static_analysis_status?: string;
  runtime_status?: string;
  remaining_issues?: Issue[];
  runtime_output?: {
    stdout?: string;
    stderr?: string;
    exit_code?: number;
  };
  feedback?: string;
}

export interface RunTestsRequest {
  language: string;
  code: string;
  test_cases: TestCase[];
}

export interface RunTestsResponse {
  all_passed: boolean;
  passed_count: number;
  total_count: number;
  results: TestCaseResult[];
  execution_time_ms?: number;
  verification_status: VerificationStatus;
  runtime_status?: string;
}

export interface HistorySession {
  id: string;
  timestamp: string;
  language: string;
  error_description: string;
  error_category: ErrorCategory;
  original_code: string;
  corrected_code?: string;
  verification_status: VerificationStatus;
  status?: string;
  root_cause?: string;
}

export interface EvaluationCategoryBreakdown {
  total: number;
  success: number;
  rate: number;
}

export interface EvaluationSummary {
  total_evaluated: number;
  successful_fixes: number;
  failed_fixes: number;
  inconclusive_results: number;
  fix_success_rate: number;
  execution_success_rate: number;
  by_category: Record<string, EvaluationCategoryBreakdown>;
  by_language: Record<string, EvaluationCategoryBreakdown>;
}

export interface BenchmarkItem {
  id: string;
  name: string;
  language: string;
  category: ErrorCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  original_code: string;
  expected_fix: string;
  status: 'Passed' | 'Failed' | 'Inconclusive';
  execution_time_ms?: number;
  tested_at?: string;
  notes?: string;
}

export interface SupportedLanguage {
  id: string;
  name: string;
  sandbox_supported: boolean;
  version?: string;
  monaco_id: string;
  notes?: string;
}

export interface ApiHealth {
  status: string;
  version?: string;
  sandbox_available?: boolean;
  message?: string;
}

export interface ApiErrorResponse {
  detail?: string | { msg?: string }[] | Record<string, unknown>;
  message?: string;
  error?: string;
  status_code?: number;
}
