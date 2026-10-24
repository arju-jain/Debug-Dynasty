import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg bg-white hover:bg-blue-50/60 border border-[#DBEAFE] text-[#475569] dark:bg-slate-800 dark:border-white/10 dark:hover:border-blue-400 dark:text-slate-300 dark:hover:text-blue-300 transition-all duration-200 shadow-xs"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-[#2563EB]" />
      )}
    </button>
  );
};
