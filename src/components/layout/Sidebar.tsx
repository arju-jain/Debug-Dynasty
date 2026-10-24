import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Terminal, 
  History, 
  BarChart3, 
  X, 
  Sparkles,
  Home,
  BookOpen
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/debugger', label: 'Debugger', icon: Terminal },
    { to: '/history', label: 'History', icon: History },
    { to: '/evaluation', label: 'Evaluation', icon: BarChart3 },
    { to: '/docs', label: 'API & Docs', icon: BookOpen },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-[#DBEAFE] dark:border-white/10 shadow-xs">
      {/* Logo & Branding */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#DBEAFE] dark:border-white/10">
        <Link to="/" className="group" onClick={() => setMobileOpen(false)}>
          <BrandLogo size="md" />
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Platform Menu
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#EFF6FF] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Sidebar Footer Callout */}
      <div className="p-4 m-3.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] dark:bg-slate-800 dark:border-white/10 space-y-1.5">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#1D4ED8] dark:text-blue-300">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Debug Dynasty</span>
        </div>
        <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-relaxed font-sans">
          Find the Bug. Fix the Code. Master the Logic.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileOpen(false)} 
          />
          <div className="relative w-64 max-w-xs flex-1 flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
