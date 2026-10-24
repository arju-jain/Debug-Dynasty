import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#123F70] bg-[#031126] text-[#9DB6D5] text-xs py-4 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
          <Link to="/" className="inline-block">
            <BrandLogo size="sm" />
          </Link>
          <span className="hidden sm:inline text-[#123F70]">•</span>
          <span className="text-[#9DB6D5] text-xs font-medium">
            Find the Bug. Fix the Code. Master the Logic.
          </span>
        </div>

        {/* Right: Essential Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium">
          <Link to="/" className="text-[#9DB6D5] hover:text-[#22D3EE] transition">
            Home
          </Link>
          <Link to="/debugger" className="text-[#9DB6D5] hover:text-[#22D3EE] transition">
            Debugger
          </Link>
          <Link to="/history" className="text-[#9DB6D5] hover:text-[#22D3EE] transition">
            History
          </Link>
          <Link to="/evaluation" className="text-[#9DB6D5] hover:text-[#22D3EE] transition">
            Evaluation
          </Link>
          <Link to="/settings" className="text-[#9DB6D5] hover:text-[#22D3EE] transition">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
};
