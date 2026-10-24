import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  ArrowRight, 
  Search, 
  Code2, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Hero Section (Two-Column Desktop Layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-6 lg:py-10">
        
        {/* Left Column: Hero Copy & Actions */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#061B35] border border-[#123F70] text-[#22D3EE] text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-[#22D3EE] text-[#22D3EE]" />
            <span className="tracking-wider uppercase text-[11px]">AI-Powered Code Debugging</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F1F7FF] leading-[1.15]">
            Debug smarter.<br />
            Code with <span className="text-[#22D3EE] drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">confidence.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[#9DB6D5] leading-relaxed max-w-lg">
            Submit your code, get AI-powered analysis, understand errors, view suggested fixes, and learn how to prevent similar bugs.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              to="/debugger"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#087CFF] to-[#2563EB] hover:from-[#1D8AFF] hover:to-[#1D4ED8] shadow-glow-blue transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start Debugging</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/debugger"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-xs text-[#F1F7FF] bg-[#061B35] hover:bg-[#082344] border border-[#123F70] hover:border-[#22D3EE]/50 transition-all"
            >
              <span>Explore Features</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Polished Developer Laptop / AI Code Visual */}
        <div className="lg:col-span-6 relative flex justify-center">
          {/* Ambient Radial Blue Glow */}
          <div className="absolute inset-0 bg-radial from-[#087CFF]/20 via-transparent to-transparent blur-3xl pointer-events-none" />

          {/* Isometric Laptop Container Card */}
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#061B35] border border-[#123F70] shadow-2xl space-y-4">
            
            {/* Top Bar with Floating AI Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#FB5575]" />
                <span className="w-3 h-3 rounded-full bg-[#FBBF24]" />
                <span className="w-3 h-3 rounded-full bg-[#00D6B2]" />
              </div>

              {/* AI Brain Floating Pill */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#082344] border border-[#22D3EE]/40 text-[#22D3EE] text-[11px] font-mono shadow-glow-cyan">
                <Cpu className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>AI Neural Core</span>
              </div>
            </div>

            {/* Laptop Code Screen Mockup */}
            <div className="rounded-xl bg-[#020817] border border-[#123F70] p-4 font-mono text-xs text-slate-300 leading-relaxed space-y-1.5 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-[#6F8BAF] border-b border-[#123F70]/60 pb-2 mb-2">
                <span>binary_search.py</span>
                <span className="text-[#00D6B2]">✓ Verified AST</span>
              </div>
              <div className="text-slate-500">1  <span className="text-[#087CFF]">def</span> <span className="text-[#22D3EE]">binary_search</span>(arr, target):</div>
              <div className="text-slate-500">2      low, high = 0, len(arr) - 1</div>
              <div className="text-slate-500">3      <span className="text-[#087CFF]">while</span> low &lt;= high:</div>
              <div className="text-slate-500">4          mid = (low + high) // 2</div>
              <div className="bg-[#00D6B2]/10 border-l-2 border-[#00D6B2] text-[#00D6B2] px-2 py-0.5 -mx-2">
                5          <span className="text-[#087CFF]">if</span> arr[mid] == target: <span className="text-[#087CFF]">return</span> mid
              </div>
              <div className="text-slate-500">6      <span className="text-[#087CFF]">return</span> -1</div>
            </div>

            {/* Floating Quick Stats inside visual */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#082344] border border-[#123F70] text-left">
                <div className="text-[10px] text-[#6F8BAF] font-semibold uppercase">Diagnosis Speed</div>
                <div className="text-sm font-bold text-[#F1F7FF] mt-0.5">14 ms</div>
              </div>
              <div className="p-3 rounded-xl bg-[#082344] border border-[#123F70] text-left">
                <div className="text-[10px] text-[#6F8BAF] font-semibold uppercase">Validation</div>
                <div className="text-sm font-bold text-[#00D6B2] mt-0.5">100% Passes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Compact Feature Cards Beneath Hero */}
      <section className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: AI-Powered Debugging */}
          <div className="p-5 rounded-2xl bg-[#061B35] border border-[#123F70] hover:border-[#078BFF] transition-all space-y-3 text-left group">
            <div className="w-10 h-10 rounded-xl bg-[#082344] border border-[#123F70] text-[#22D3EE] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 text-[#22D3EE]" />
            </div>
            <h3 className="text-sm font-bold text-[#F1F7FF]">
              AI-Powered Debugging
            </h3>
            <p className="text-xs text-[#9DB6D5] leading-relaxed">
              Identify errors and explain their causes with deep AST code reasoning.
            </p>
          </div>

          {/* Card 2: Smart Fix & Code Diff */}
          <div className="p-5 rounded-2xl bg-[#061B35] border border-[#123F70] hover:border-[#078BFF] transition-all space-y-3 text-left group">
            <div className="w-10 h-10 rounded-xl bg-[#082344] border border-[#123F70] text-[#087CFF] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5 text-[#087CFF]" />
            </div>
            <h3 className="text-sm font-bold text-[#F1F7FF]">
              Smart Fix & Code Diff
            </h3>
            <p className="text-xs text-[#9DB6D5] leading-relaxed">
              Review suggested fixes and compare code changes with side-by-side Monaco diffs.
            </p>
          </div>

          {/* Card 3: Test & Learn */}
          <div className="p-5 rounded-2xl bg-[#061B35] border border-[#123F70] hover:border-[#078BFF] transition-all space-y-3 text-left group">
            <div className="w-10 h-10 rounded-xl bg-[#082344] border border-[#123F70] text-[#00D6B2] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-[#00D6B2]" />
            </div>
            <h3 className="text-sm font-bold text-[#F1F7FF]">
              Test & Learn
            </h3>
            <p className="text-xs text-[#9DB6D5] leading-relaxed">
              Validate code and understand how to prevent similar bugs through targeted tests.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
