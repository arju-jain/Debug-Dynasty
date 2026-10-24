import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogIn, LogOut } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { AuthModal } from '../common/AuthModal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/debugger', label: 'Debugger' },
    { to: '/history', label: 'History' },
    { to: '/evaluation', label: 'Evaluation' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#123F70] bg-[#031126]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="group flex items-center">
                <BrandLogo size="md" />
              </Link>
            </div>

            {/* Center: Main Top Navigation */}
            <nav className="hidden md:flex items-center space-x-8 text-xs font-medium">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `py-4 transition-all relative ${
                      isActive
                        ? 'text-[#F1F7FF] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#22D3EE] after:shadow-glow-cyan'
                        : 'text-[#9DB6D5] hover:text-[#F1F7FF]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right: Theme Toggle & Authentication / Profile */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle Pill */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full bg-[#061B35] hover:bg-[#082344] border border-[#123F70] text-[#9DB6D5] hover:text-[#22D3EE] transition shadow-xs"
                title={`Theme: ${theme}`}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#22D3EE]" />
                )}
              </button>

              {/* Login Button when logged out OR User Avatar & Logout when logged in */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-[#061B35] border border-[#123F70]"
                    title={`Signed in as ${user?.email}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#087CFF] text-[#FFFFFF] font-bold text-xs flex items-center justify-center border border-[#22D3EE]/60 shadow-glow-cyan">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-medium text-[#F1F7FF] max-w-[90px] truncate hidden sm:inline-block">
                      {user?.name || user?.email.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg bg-[#061B35] hover:bg-[#082344] border border-[#123F70] text-[#9DB6D5] hover:text-[#FB5575] transition shadow-xs"
                    title="Sign Out"
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#087CFF] to-[#2563EB] hover:from-[#1D8AFF] hover:to-[#1D4ED8] shadow-glow-blue transition-all"
                  aria-label="Login"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Login</span>
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-[#9DB6D5] hover:text-white hover:bg-[#061B35] border border-[#123F70]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#123F70] bg-[#031126] px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-[#061B35] text-[#22D3EE] border-l-2 border-[#22D3EE]'
                      : 'text-[#9DB6D5] hover:text-white hover:bg-[#061B35]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-[#123F70]/60 mt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#FB5575] hover:bg-[#061B35]"
                >
                  <span>Signed in as {user?.name || user?.email}</span>
                  <span className="flex items-center space-x-1">
                    <span>Logout</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#087CFF]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
