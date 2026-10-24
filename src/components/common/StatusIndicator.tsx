import React, { useState } from 'react';
import { useApiHealth } from '../../context/ApiHealthContext';
import { RefreshCw, Server, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export const StatusIndicator: React.FC = () => {
  const { isHealthy, isChecking, healthData, errorMessage, checkServerHealth, apiUrl } = useApiHealth();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 text-slate-700 dark:bg-midnight-900/80 dark:hover:bg-midnight-800 dark:border-white/10 dark:text-slate-300 shadow-xs"
        title="Backend connection status. Click for details."
      >
        <span className="relative flex h-2 w-2">
          {isHealthy ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </>
          ) : isChecking ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <span className="hidden sm:inline font-medium">
          {isChecking ? 'Checking...' : isHealthy ? 'Backend Connected' : 'Backend Offline'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-80 p-4 rounded-xl shadow-lg bg-white border border-[#DBEAFE] dark:bg-slate-900 dark:border-white/10 backdrop-blur-md z-50 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-[#DBEAFE] dark:border-white/10">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] dark:text-slate-300">FastAPI Backend</span>
            </div>
            <button
              onClick={() => checkServerHealth()}
              disabled={isChecking}
              className="p-1 rounded hover:bg-blue-50 text-[#475569] hover:text-[#0F172A] dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-white transition disabled:opacity-50"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#475569] dark:text-slate-400">
              <span>Endpoint:</span>
              <span className="font-mono text-[#2563EB] dark:text-blue-300 truncate max-w-[170px]" title={apiUrl}>{apiUrl}</span>
            </div>
            <div className="flex justify-between items-center text-[#475569] dark:text-slate-400">
              <span>Status:</span>
              <span className="flex items-center space-x-1 font-semibold">
                {isHealthy ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400">Online & Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-600 dark:text-rose-400">Disconnected</span>
                  </>
                )}
              </span>
            </div>
            {healthData?.version && (
              <div className="flex justify-between items-center text-[#475569] dark:text-slate-400">
                <span>Version:</span>
                <span className="font-mono text-[#0F172A] dark:text-slate-200">v{healthData.version}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[#475569] dark:text-slate-400">
              <span>Sandbox Isolation:</span>
              <span className={healthData?.sandbox_available !== false ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-amber-700 dark:text-amber-400'}>
                {healthData?.sandbox_available !== false ? 'Subprocess Ready' : 'Local Only'}
              </span>
            </div>
          </div>

          {!isHealthy && errorMessage && (
            <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300 text-[11px] leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Connection Notice
              </p>
              <p>{errorMessage}</p>
              <p className="mt-1 text-slate-500 font-mono text-[10px]">
                Start: uvicorn main:app --host 0.0.0.0 --port 8000
              </p>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-[#DBEAFE] dark:border-white/10">
            <button
              onClick={() => {
                checkServerHealth();
                setShowDetails(false);
              }}
              className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-[#DBEAFE] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 rounded-lg text-xs font-semibold transition"
            >
              Test Connection Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
