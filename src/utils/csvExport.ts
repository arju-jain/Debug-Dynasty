import { BenchmarkItem, EvaluationSummary } from '../types/api';

export function exportBenchmarksToCSV(benchmarks: BenchmarkItem[], summary?: EvaluationSummary | null): void {
  if (!benchmarks || benchmarks.length === 0) {
    throw new Error('No benchmark data available to export.');
  }

  const headers = ['ID', 'Name', 'Language', 'Category', 'Difficulty', 'Status', 'Execution Time (ms)', 'Tested At', 'Notes'];
  
  const rows = benchmarks.map(item => [
    `"${item.id || ''}"`,
    `"${(item.name || '').replace(/"/g, '""')}"`,
    `"${item.language || ''}"`,
    `"${item.category || ''}"`,
    `"${item.difficulty || ''}"`,
    `"${item.status || ''}"`,
    item.execution_time_ms !== undefined ? item.execution_time_ms : '',
    `"${item.tested_at || ''}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,';
  
  if (summary) {
    csvContent += `"# Debug Dynasty Evaluation Benchmark Report"\n`;
    csvContent += `"# Total Evaluated: ${summary.total_evaluated || 0}, Fix Success Rate: ${summary.fix_success_rate || 0}%, Execution Success Rate: ${summary.execution_success_rate || 0}%"\n\n`;
  }

  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `debug_dynasty_benchmark_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
