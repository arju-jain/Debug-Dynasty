import React from 'react';
import { 
  BookOpen, 
  Terminal, 
  Server, 
  Code2, 
  Copy
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

export const DocsPage: React.FC = () => {
  const toast = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', `${label} copied to clipboard.`);
  };

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/health',
      desc: 'Checks backend health status, API version, and sandbox availability.',
      req: 'None',
      res: `{ "status": "healthy", "version": "1.0.0", "sandbox_available": true }`,
    },
    {
      method: 'POST',
      path: '/api/debug',
      desc: 'Primary code debugging endpoint. Analyzes code, error description, and test cases.',
      req: `{
  "language": "python",
  "code": "def add(a, b): return a - b",
  "error_description": "Expected addition but received subtraction",
  "expected_behavior": "Return the sum of a and b",
  "stdin": "",
  "test_cases": [{ "input": "2,3", "expected_output": "5" }]
}`,
      res: `{
  "session_id": "ses_9f8b2c",
  "detected_issue": "Subtracted instead of added",
  "error_category": "Logic",
  "root_cause": "Operator '-' used instead of '+' in return statement",
  "affected_line": 1,
  "explanation": "The function returns a - b which subtracts b from a...",
  "recommended_fix": "Change operator - to +",
  "corrected_code": "def add(a, b):\\n    return a + b\\n",
  "verification_status": "Suggested",
  "assumptions_and_uncertainty": ["Assumes integers or numeric inputs"],
  "suggested_additional_tests": [{ "input": "-2, 5", "expected_output": "3" }]
}`,
    },
    {
      method: 'POST',
      path: '/api/validate-fix',
      desc: 'Performs dry-run or static validation of the proposed fix against requirements.',
      req: `{
  "language": "python",
  "original_code": "def add(a, b): return a - b",
  "corrected_code": "def add(a, b): return a + b",
  "expected_behavior": "Return the sum of a and b"
}`,
      res: `{
  "is_valid": true,
  "verification_status": "Validated",
  "validation_details": "Fix strictly matches expected behavior without introducing side effects.",
  "runtime_output": { "stdout": "Test passed", "exit_code": 0 }
}`,
    },
    {
      method: 'POST',
      path: '/api/run-tests',
      desc: 'Runs test assertions in the isolated sandbox runner and returns structured pass/fail results.',
      req: `{
  "language": "python",
  "code": "def add(a, b): return a + b",
  "test_cases": [{ "input": "2,3", "expected_output": "5" }]
}`,
      res: `{
  "all_passed": true,
  "passed_count": 1,
  "total_count": 1,
  "verification_status": "Tests Passed",
  "results": [
    { "input": "2,3", "expected_output": "5", "actual_output": "5", "passed": true, "execution_time_ms": 12 }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/api/history',
      desc: 'Retrieves previous debugging session summaries.',
      req: 'None',
      res: `[
  {
    "id": "ses_9f8b2c",
    "timestamp": 1713456789,
    "language": "python",
    "error_description": "Expected addition but received subtraction",
    "error_category": "Logic",
    "root_cause": "Operator '-' used instead of '+' in return statement",
    "original_code": "def add(a, b): return a - b",
    "corrected_code": "def add(a, b): return a + b",
    "verification_status": "Tests Passed"
  }
]`,
    },
    {
      method: 'DELETE',
      path: '/api/history/{session_id}',
      desc: 'Deletes a saved debugging session.',
      req: 'None',
      res: `{ "success": true, "message": "Session deleted successfully" }`,
    },
    {
      method: 'GET',
      path: '/api/evaluation',
      desc: 'Returns benchmark summary metrics (total, success rates, breakdowns).',
      req: 'None',
      res: `{
  "total_evaluated": 150,
  "successful_fixes": 128,
  "failed_fixes": 15,
  "inconclusive_results": 7,
  "fix_success_rate": 85.3,
  "execution_success_rate": 82.0,
  "by_category": { "Logic": { "total": 50, "success": 42, "rate": 84.0 } },
  "by_language": { "python": { "total": 60, "success": 55, "rate": 91.6 } }
}`,
    },
    {
      method: 'GET',
      path: '/api/evaluation/benchmark',
      desc: 'Returns array of individual benchmark evaluation cases.',
      req: 'None',
      res: `[
  {
    "id": "bm_01",
    "name": "Binary Search Boundary",
    "language": "python",
    "category": "Boundary Condition",
    "difficulty": "Medium",
    "original_code": "...",
    "expected_fix": "...",
    "status": "Passed",
    "execution_time_ms": 24
  }
]`,
    },
    {
      method: 'GET',
      path: '/api/languages',
      desc: 'Returns supported languages and sandbox runner capabilities.',
      req: 'None',
      res: `[
  { "id": "python", "name": "Python", "sandbox_supported": true, "version": "3.11", "monaco_id": "python" }
]`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full text-slate-700 dark:text-slate-300">
      {/* Header */}
      <div className="border-b border-[#DBEAFE] dark:border-white/10 pb-5 space-y-2">
        <div className="flex items-center space-x-2.5">
          <BookOpen className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">API Contract & Integration Guide</h1>
        </div>
        <p className="text-xs text-[#475569] dark:text-slate-400">
          Complete documentation of endpoints, payload schemas, and environment configuration for the FastAPI backend team.
        </p>
      </div>

      {/* Backend Base URL & Env Setup */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-blue-300 flex items-center gap-2 font-mono">
          <Server className="w-4 h-4 text-[#2563EB] dark:text-blue-400" /> 1. Environment & Base URL Configuration
        </h2>
        <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
          The frontend communicates with the backend via the centralized API client configured with the environment variable <code className="text-[#1D4ED8] bg-blue-50 px-1.5 py-0.5 rounded border border-[#DBEAFE] font-mono text-[11px] dark:text-blue-300 dark:bg-cyan-950/40">VITE_API_BASE_URL</code>.
        </p>
        <div className="p-4 rounded-2xl border border-[#DBEAFE] bg-white shadow-xs dark:border-white/10 dark:bg-midnight-900 font-mono text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>.env (or .env.local)</span>
            <button
              onClick={() => copyToClipboard('VITE_API_BASE_URL=http://127.0.0.1:8000', 'Env Config')}
              className="text-[#2563EB] hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:text-white flex items-center gap-1 font-semibold"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="text-[#0F172A] dark:text-cyan-200 font-semibold">VITE_API_BASE_URL=http://127.0.0.1:8000</pre>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 text-xs">
          <strong>Security Note:</strong> Vite environment variables prefixed with <code className="bg-amber-100 dark:bg-black/30 px-1 py-0.5 rounded">VITE_</code> are embedded into the client browser bundle. Never store private API secret keys, database credentials, or proprietary tokens in frontend variables.
        </div>
      </section>

      {/* How Backend Developer Runs Server */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-blue-300 flex items-center gap-2 font-mono">
          <Terminal className="w-4 h-4 text-[#2563EB] dark:text-blue-400" /> 2. FastAPI Backend Quickstart (Teammate's Laptop)
        </h2>
        <div className="p-4 rounded-2xl border border-[#DBEAFE] bg-white shadow-xs dark:border-white/10 dark:bg-midnight-900 font-mono text-xs space-y-2">
          <p className="text-slate-500"># Start FastAPI with hot reload on port 8000:</p>
          <pre className="text-emerald-700 dark:text-emerald-300 font-semibold">uvicorn main:app --reload --host 127.0.0.1 --port 8000</pre>
          <p className="text-slate-500 pt-2"># Enable CORS in FastAPI (main.py):</p>
          <pre className="text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-midnight-950 p-3 rounded-xl border border-slate-200 dark:border-white/5">{`from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Or ["http://localhost:5173", "http://127.0.0.1:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`}</pre>
        </div>
      </section>

      {/* Detailed API Endpoints */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-blue-300 flex items-center gap-2 font-mono">
          <Code2 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" /> 3. Endpoints Specification
        </h2>

        <div className="space-y-4">
          {apiEndpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-[#DBEAFE] bg-white shadow-xs dark:border-white/10 dark:bg-midnight-900/80 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DBEAFE] dark:border-white/10">
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      ep.method === 'GET'
                        ? 'bg-blue-50 text-[#1D4ED8] border border-[#DBEAFE]'
                        : ep.method === 'POST'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-semibold text-[#0F172A] dark:text-white">{ep.path}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(ep.path, ep.path)}
                  className="text-[#475569] hover:text-[#2563EB] text-xs font-mono flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" /> Copy Path
                </button>
              </div>

              <p className="text-xs text-[#475569] dark:text-slate-300">{ep.desc}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs font-mono">
                {ep.req !== 'None' && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1 font-semibold">
                      Request Body (JSON):
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-50 border border-[#DBEAFE] text-slate-800 overflow-x-auto text-[11px] max-h-48 whitespace-pre-wrap dark:bg-midnight-950 dark:border-white/5 dark:text-slate-300">
                      {ep.req}
                    </pre>
                  </div>
                )}
                <div className={ep.req === 'None' ? 'lg:col-span-2' : ''}>
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1 font-semibold">
                    Response Body (JSON):
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-[#DBEAFE] text-emerald-700 overflow-x-auto text-[11px] max-h-48 whitespace-pre-wrap dark:bg-midnight-950 dark:border-white/5 dark:text-emerald-300">
                    {ep.res}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Shortcuts Table */}
      <section className="space-y-3 pb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-blue-300 flex items-center gap-2 font-mono">
          <Terminal className="w-4 h-4 text-[#2563EB] dark:text-blue-400" /> 4. Workspace Keyboard Shortcuts
        </h2>
        <div className="p-5 rounded-2xl border border-[#DBEAFE] bg-white shadow-xs dark:border-white/10 dark:bg-midnight-900/80">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[#DBEAFE] dark:border-white/10 text-slate-500">
                <th className="py-2.5 px-3 font-semibold">Key Combination</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBEAFE] dark:divide-white/5 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-3">
                  <kbd className="px-2 py-0.5 rounded-lg bg-blue-50 border border-[#DBEAFE] text-[#1D4ED8] font-semibold">Ctrl + Enter</kbd> or <kbd className="px-2 py-0.5 rounded-lg bg-blue-50 border border-[#DBEAFE] text-[#1D4ED8] font-semibold">Cmd + Enter</kbd>
                </td>
                <td className="py-2.5 px-3">Execute "Debug Code" request to backend engine</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <kbd className="px-2 py-0.5 rounded-lg bg-blue-50 border border-[#DBEAFE] text-[#1D4ED8] font-semibold">Ctrl + Shift + C</kbd> or <kbd className="px-2 py-0.5 rounded-lg bg-blue-50 border border-[#DBEAFE] text-[#1D4ED8] font-semibold">Cmd + Shift + C</kbd>
                </td>
                <td className="py-2.5 px-3">Copy generated corrected code to system clipboard</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
