import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  User, 
  HelpCircle, 
  Check, 
  Moon, 
  Sun, 
  Laptop, 
  ChevronDown, 
  Save, 
  ShieldCheck, 
  ExternalLink,
  LogOut,
  LogIn,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/common/AuthModal';
import { resetDynastyTrials, isDevEnvironment } from '../utils/trialManager';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Active Sidebar Tab (API & Backend removed)
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'account' | 'help'>('general');

  // Form states
  const [interfaceLang, setInterfaceLang] = useState('en');
  const [defaultCodeLang, setDefaultCodeLang] = useState(() => localStorage.getItem('debugdynasty_default_lang') || 'auto');
  const [autoSave, setAutoSave] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('debugdynasty_default_lang', defaultCodeLang);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings Saved', 'Your preferences have been saved and persisted.');
    }, 400);
  };

  const navItems = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">
      
      {/* Settings Container (Left Sidebar + Right Content Area) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="md:col-span-4 lg:col-span-3 rounded-2xl bg-[#061B35] border border-[#123F70] p-3 shadow-xl space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-[#087CFF] text-white shadow-glow-blue'
                    : 'text-[#9DB6D5] hover:text-[#F1F7FF] hover:bg-[#082344]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Content Area */}
        <div className="md:col-span-8 lg:col-span-9 rounded-2xl bg-[#061B35] border border-[#123F70] p-6 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="border-b border-[#123F70]/80 pb-4">
            <h1 className="text-xl font-bold text-[#F1F7FF] tracking-tight">Settings</h1>
            <p className="text-xs text-[#9DB6D5] mt-0.5">Customize your Debug Dynasty experience.</p>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F7FF] font-mono">
                General Settings
              </h2>

              {/* Theme Preference */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9DB6D5]">Theme</label>
                <div className="flex rounded-xl bg-[#082344] p-1 max-w-xs border border-[#123F70]">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      theme === 'light'
                        ? 'bg-[#087CFF] text-white shadow-xs'
                        : 'text-[#9DB6D5] hover:text-[#F1F7FF]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      theme === 'dark'
                        ? 'bg-[#087CFF] text-white shadow-xs'
                        : 'text-[#9DB6D5] hover:text-[#F1F7FF]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 text-[#9DB6D5] hover:text-[#F1F7FF]"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Language Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9DB6D5]">Language</label>
                <div className="relative max-w-sm">
                  <select
                    value={interfaceLang}
                    onChange={(e) => setInterfaceLang(e.target.value)}
                    className="w-full py-2 pl-3 pr-8 rounded-xl bg-[#020817] border border-[#123F70] text-xs font-mono text-[#F1F7FF] appearance-none focus:outline-none focus:border-[#22D3EE]"
                    aria-label="Interface Language"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Default Code Language */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9DB6D5]">Default Code Language</label>
                <div className="relative max-w-sm">
                  <select
                    value={defaultCodeLang}
                    onChange={(e) => setDefaultCodeLang(e.target.value)}
                    className="w-full py-2 pl-3 pr-8 rounded-xl bg-[#020817] border border-[#123F70] text-xs font-mono text-[#F1F7FF] appearance-none focus:outline-none focus:border-[#22D3EE]"
                    aria-label="Default Code Language"
                  >
                    <option value="auto">Auto-Detect Language (Recommended)</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                {/* Auto-save */}
                <div className="flex items-center justify-between max-w-md">
                  <span className="text-xs text-[#F1F7FF] font-medium">Auto-save your sessions</span>
                  <button
                    type="button"
                    onClick={() => setAutoSave(!autoSave)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${autoSave ? 'bg-[#087CFF]' : 'bg-[#123F70]'}`}
                    aria-label="Toggle auto-save"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSave ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Show line numbers */}
                <div className="flex items-center justify-between max-w-md">
                  <span className="text-xs text-[#F1F7FF] font-medium">Show line numbers</span>
                  <button
                    type="button"
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${showLineNumbers ? 'bg-[#087CFF]' : 'bg-[#123F70]'}`}
                    aria-label="Toggle show line numbers"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showLineNumbers ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Enable sound notifications */}
                <div className="flex items-center justify-between max-w-md">
                  <span className="text-xs text-[#F1F7FF] font-medium">Enable sound notifications</span>
                  <button
                    type="button"
                    onClick={() => setSoundNotifications(!soundNotifications)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${soundNotifications ? 'bg-[#087CFF]' : 'bg-[#123F70]'}`}
                    aria-label="Toggle sound notifications"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F7FF] font-mono">
                Appearance Settings
              </h2>
              <p className="text-[#9DB6D5]">
                Debug Dynasty uses the verified dark navy and cyan developer theme matching the primary reference design.
              </p>
              <div className="p-4 rounded-xl bg-[#020817] border border-[#123F70] space-y-2 font-mono">
                <div className="text-[11px] text-[#6F8BAF]">Active Theme Palette:</div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded bg-[#020817] border border-[#123F70]" title="#020817 Main Background" />
                  <div className="w-5 h-5 rounded bg-[#061B35] border border-[#123F70]" title="#061B35 Card Background" />
                  <div className="w-5 h-5 rounded bg-[#087CFF]" title="#087CFF Primary Blue" />
                  <div className="w-5 h-5 rounded bg-[#22D3EE]" title="#22D3EE Cyan Accent" />
                  <div className="w-5 h-5 rounded bg-[#00D6B2]" title="#00D6B2 Success Teal" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F7FF] font-mono">
                Account Session
              </h2>
              {isAuthenticated && user ? (
                <div className="p-4 rounded-xl bg-[#020817] border border-[#123F70] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#087CFF] text-white font-bold flex items-center justify-center border border-[#22D3EE]/50 shadow-glow-cyan text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-[#F1F7FF] text-sm">{user.name}</div>
                        <div className="text-[11px] text-[#9DB6D5] font-mono">{user.email}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#00D6B2]/15 border border-[#00D6B2]/30 text-[#00D6B2] text-[11px] font-semibold">
                      {user.role || 'Developer'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#123F70]/60 flex items-center justify-between">
                    <span className="text-[11px] text-[#6F8BAF]">Session token active</span>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FB5575] bg-[#FB5575]/10 hover:bg-[#FB5575]/20 border border-[#FB5575]/30 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#020817] border border-[#123F70] space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#082344] border border-[#123F70] text-[#22D3EE] flex items-center justify-center mx-auto">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-[#F1F7FF]">Anonymous Developer Mode</div>
                  <p className="text-xs text-[#9DB6D5] max-w-sm mx-auto">
                    You are exploring with 2 free trials. Sign in or create an account to unlock unlimited debugging, session persistence, and custom configurations.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087CFF] to-[#2563EB] hover:from-[#1D8AFF] hover:to-[#1D4ED8] shadow-glow-blue transition"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Sign In / Create Account</span>
                    </button>
                    {isDevEnvironment() && (
                      <button
                        type="button"
                        onClick={() => {
                          resetDynastyTrials();
                          toast.info('Trials Reset', 'Anonymous free trials reset to 2 for development.');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-[#22D3EE] bg-[#082344] hover:bg-[#123F70] border border-[#123F70] transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span>[Dev Mode] Reset Trials (2)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F7FF] font-mono">
                Help & Documentation
              </h2>
              <p className="text-[#9DB6D5] leading-relaxed">
                Need help or have questions about AI debugging algorithms and sandbox test isolation?
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <a
                  href="/docs"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#082344] hover:bg-[#123F70] border border-[#123F70] text-[#22D3EE] font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View API Contract Docs</span>
                </a>
              </div>
            </div>
          )}

          {/* Bottom Banner & Save Button */}
          <div className="border-t border-[#123F70]/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#6F8BAF]">
              Need Help? Check out our documentation or contact support for assistance.
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087CFF] to-[#2563EB] hover:from-[#1D8AFF] hover:to-[#1D4ED8] shadow-glow-blue transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
