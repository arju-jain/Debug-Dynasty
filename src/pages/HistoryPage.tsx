import React, { useState, useEffect, useMemo } from 'react';
import { HistorySession, ErrorCategory, VerificationStatus } from '../types/api';
import { getHistory, deleteHistorySession } from '../api/history';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../components/common/Toast';
import { EmptyState } from '../components/common/EmptyState';
import { 
  Search, 
  ChevronDown, 
  Eye, 
  Trash2, 
  Check, 
  Calendar, 
  RefreshCw, 
  X,
  FileCode2,
  History
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const toast = useToast();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [activeSession, setActiveSession] = useState<HistorySession | null>(null);

  // Fetch history from backend
  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      const data = await getHistory();
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistorySession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSession?.id === id) setActiveSession(null);
      toast.success('Deleted', 'Debugging record removed from history.');
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Deleted', 'Record removed.');
    }
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = s.error_description.toLowerCase().includes(term);
        const matchesLang = s.language.toLowerCase().includes(term);
        const matchesId = s.id.toLowerCase().includes(term);
        if (!matchesDesc && !matchesLang && !matchesId) return false;
      }
      if (selectedLanguage !== 'all' && s.language.toLowerCase() !== selectedLanguage.toLowerCase()) {
        return false;
      }
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'fixed' && s.verification_status !== 'Tests Passed' && s.verification_status !== 'Validated') {
          return false;
        }
      }
      return true;
    });
  }, [sessions, searchTerm, selectedLanguage, selectedStatus]);

  const getLanguageBadge = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'python') return 'bg-[#087CFF]/20 text-[#087CFF] border-[#087CFF]/40';
    if (l === 'java') return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    if (l === 'cpp' || l === 'c++') return 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40';
    if (l === 'javascript' || l === 'js') return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
    return 'bg-slate-700/30 text-slate-300 border-slate-600/40';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-5">
      
      {/* Top Header & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F7FF] tracking-tight">Debugging History</h1>
          <p className="text-xs text-[#9DB6D5] mt-0.5">View your past debugging sessions and results.</p>
        </div>

        {/* Search Bar & Language Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by issue description or snippet..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#061B35] border border-[#123F70] text-xs text-[#F1F7FF] placeholder-slate-400 focus:outline-none focus:border-[#22D3EE]"
            />
          </div>

          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="py-1.5 pl-3 pr-8 rounded-xl bg-[#061B35] border border-[#123F70] text-xs text-[#F1F7FF] appearance-none focus:outline-none focus:border-[#22D3EE]"
              aria-label="Filter language"
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Secondary Filter Row */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Language Filter */}
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="py-1 px-3 pr-7 rounded-lg bg-[#061B35] border border-[#123F70] text-xs text-[#9DB6D5] appearance-none"
            aria-label="Language filter"
          >
            <option value="all">Language</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1 px-3 pr-7 rounded-lg bg-[#061B35] border border-[#123F70] text-xs text-[#9DB6D5] appearance-none"
            aria-label="Status filter"
          >
            <option value="all">Status</option>
            <option value="fixed">Fixed</option>
            <option value="unverified">Unverified</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="py-1 px-3 pr-7 rounded-lg bg-[#061B35] border border-[#123F70] text-xs text-[#9DB6D5] appearance-none"
            aria-label="Date range filter"
          >
            <option value="30d">Last 30 days</option>
            <option value="7d">Last 7 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
        </div>

        <button
          onClick={fetchHistoryData}
          className="ml-auto text-xs text-[#22D3EE] hover:underline flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main History Table Container */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Debugging Sessions Found"
          description="No debugging sessions have been recorded on the backend yet. Submit a snippet in the debugger to create your first session."
        />
      ) : (
        <div className="rounded-2xl bg-[#061B35] border border-[#123F70] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#123F70] bg-[#031126]/60 text-[#6F8BAF] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#123F70]/60 text-[#F1F7FF]">
                {filteredSessions.map((session) => {
                  const lines = session.error_description.split('\n');
                  const title = lines[0] || 'Debugging Session';
                  const sub = lines[1] || session.root_cause || '';

                  return (
                    <tr key={session.id} className="hover:bg-[#082344]/50 transition-colors">
                      {/* Title / Description & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start space-x-2.5">
                          <div className="w-6 h-6 rounded-md bg-[#082344] text-[#087CFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileCode2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-[#F1F7FF]">{title}</span>
                              <span className="text-[10px] text-[#22D3EE] font-mono">#{session.id}</span>
                            </div>
                            {sub && <div className="text-[11px] text-[#9DB6D5] mt-0.5">{sub}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Language Badge */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${getLanguageBadge(session.language)}`}>
                          {session.language}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-xs text-[#9DB6D5] whitespace-nowrap">
                        {new Date(session.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} {' '}
                        <span className="text-[#6F8BAF]">
                          {new Date(session.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#00D6B2]/15 border border-[#00D6B2]/40 text-[#00D6B2] text-[11px] font-semibold">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Fixed</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => setActiveSession(session)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#22D3EE] hover:bg-[#082344] transition"
                            title="View Session Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#FB5575] hover:bg-[#082344] transition"
                            title="Delete session record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#061B35] border border-[#123F70] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#123F70] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F1F7FF]">Session Details</h3>
                <p className="text-xs text-[#9DB6D5] capitalize">Language: {activeSession.language} • #{activeSession.id}</p>
              </div>
              <button onClick={() => setActiveSession(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Original Code:</span>
                <pre className="p-3 rounded-xl bg-[#020817] border border-[#123F70] text-rose-300 overflow-x-auto mt-1">
                  {activeSession.original_code}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Corrected Fix:</span>
                <pre className="p-3 rounded-xl bg-[#020817] border border-[#123F70] text-emerald-300 overflow-x-auto mt-1">
                  {activeSession.corrected_code}
                </pre>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#087CFF] hover:bg-[#2563EB]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
