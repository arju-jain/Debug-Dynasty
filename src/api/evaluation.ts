import { apiClient } from './client';
import { BenchmarkItem, ErrorCategory, EvaluationSummary } from '../types/api';

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

export const getEvaluationSummary = async (): Promise<EvaluationSummary> => {
  const data = await apiClient.get<any>('/api/evaluation');

  const totalEvaluated = data.total_evaluated ?? data.evaluated_count ?? 0;
  const successfulFixes = data.successful_fixes ?? data.functional_success_count ?? 0;
  const failedFixes = data.failed_fixes ?? data.failed_count ?? 0;
  const inconclusive = data.inconclusive_results ?? data.inconclusive_count ?? 0;
  const fixSuccessRate = data.fix_success_rate ?? data.functional_success_rate ?? 0;
  const execSuccessRate = data.execution_success_rate ?? 0;

  const rawCategories = data.by_category || data.category_breakdown || {};
  const byCategory: Record<string, { total: number; success: number; rate: number }> = {};
  for (const [cat, val] of Object.entries<any>(rawCategories)) {
    byCategory[cat] = {
      total: val.total ?? 0,
      success: val.success ?? val.passed ?? 0,
      rate: val.rate ?? val.functional_rate ?? 0
    };
  }

  const byLanguage = data.by_language || {
    python: {
      total: data.total_benchmarks ?? totalEvaluated,
      success: successfulFixes,
      rate: fixSuccessRate
    }
  };

  return {
    total_evaluated: totalEvaluated,
    successful_fixes: successfulFixes,
    failed_fixes: failedFixes,
    inconclusive_results: inconclusive,
    fix_success_rate: fixSuccessRate,
    execution_success_rate: execSuccessRate,
    by_category: byCategory,
    by_language: byLanguage
  };
};

export const getBenchmarkItems = async (): Promise<BenchmarkItem[]> => {
  const response = await apiClient.get<any>('/api/evaluation/benchmark');
  let rawList: any[] = [];

  if (Array.isArray(response)) {
    rawList = response;
  } else if (response && Array.isArray(response.items)) {
    rawList = response.items;
  } else if (response && Array.isArray(response.benchmarks)) {
    rawList = response.benchmarks;
  }

  return rawList.map((item: any) => {
    let status: 'Passed' | 'Failed' | 'Inconclusive' = 'Inconclusive';
    const s = String(item.status || '').toLowerCase();
    if (s === 'passed') status = 'Passed';
    else if (s === 'failed') status = 'Failed';

    return {
      id: item.id || item.snippet_id || '',
      name: item.name || item.title || 'Benchmark Case',
      language: item.language || 'python',
      category: normalizeErrorCategory(item.category),
      difficulty: item.difficulty || 'Medium',
      original_code: item.original_code || item.buggy_code || '',
      expected_fix: item.expected_fix || item.corrected_code || item.reference_fix || '',
      status: status,
      execution_time_ms: item.execution_time_ms,
      tested_at: item.tested_at || item.last_evaluated_at,
      notes: item.notes || item.failure_reason
    };
  });
};
