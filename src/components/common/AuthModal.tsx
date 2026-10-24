import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { useToast } from './Toast';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { resetDynastyTrials, isDevEnvironment } from '../../utils/trialManager';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'signin' 
}) => {
  const toast = useToast();
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'signin') {
        await login(email, password);
        toast.success('Signed In Successfully', `Welcome back to Debug Dynasty, ${email.split('@')[0]}!`);
      } else {
        await register(name, email, password);
        toast.success('Account Created', `Welcome to Debug Dynasty, ${name}! Your developer workspace is ready.`);
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
      toast.error('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemo();
    toast.success('Demo Developer Session Active', 'Signed in as Alex Chen (Staff Engineer).');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#061B35] border border-[#123F70] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#123F70] flex items-center justify-between">
          <BrandLogo size="sm" />
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-5">
          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-[#FB5575]/15 border border-[#FB5575]/40 text-[#FB5575] text-xs font-mono">
              {errorMessage}
            </div>
          )}
          <div className="flex rounded-xl bg-[#082344] p-1 border border-[#123F70]">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-[#087CFF] text-white shadow-glow-blue'
                  : 'text-[#9DB6D5] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[#087CFF] text-white shadow-glow-blue'
                  : 'text-[#9DB6D5] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#9DB6D5] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#123F70] bg-[#020817] text-[#F1F7FF] placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#9DB6D5] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@debugdynasty.dev"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#123F70] bg-[#020817] text-[#F1F7FF] placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#9DB6D5]">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => toast.info('Password Reset', 'A password reset link will be sent to your email.')}
                  className="text-[11px] text-[#22D3EE] hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#123F70] bg-[#020817] text-[#F1F7FF] placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087CFF] to-[#2563EB] hover:from-[#1D8AFF] hover:to-[#1D4ED8] shadow-glow-blue transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Debug Dynasty' : 'Register Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#123F70]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold text-slate-400">
              <span className="bg-[#061B35] px-2 text-[#6F8BAF]">Or continue with</span>
            </div>
          </div>

          {/* Instant Hackathon Demo Sign-In */}
          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[#00D6B2] bg-[#082344] hover:bg-[#123F70] border border-[#123F70] transition-all flex items-center justify-center space-x-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-[#00D6B2]" />
            <span>Instant Hackathon Demo Sign-In</span>
          </button>

          {/* Development / Hackathon Reset Option (visible only in dev / localhost) */}
          {isDevEnvironment() && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  resetDynastyTrials();
                  toast.info('Trials Reset', 'Anonymous free trials reset to 2 for testing.');
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-[#22D3EE] hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>[Dev Mode] Reset Anonymous Free Trials (2)</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
