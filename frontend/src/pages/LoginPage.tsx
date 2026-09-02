import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, BrainCircuit, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend API server (http://localhost:8000). Please ensure the FastAPI backend is running.');
      } else {
        const detail = err?.response?.data?.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail.map((e: any) => e.msg || JSON.stringify(e)).join(' | '));
        } else if (detail && typeof detail === 'object') {
          setError(JSON.stringify(detail));
        } else {
          setError('Invalid login credentials. Please check email & password.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Left Side: Brand Showcase */}
        <div className="p-8 bg-gradient-to-br from-indigo-950/60 to-slate-900 border-r border-slate-800/80 flex flex-col justify-between relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-100 leading-none">ITOps AI</h1>
                <p className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase mt-1">
                  Enterprise ITSM Platform
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-slate-100 leading-tight">
                AI-Powered IT Service Management
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intelligent incident management, infrastructure monitoring, SLA compliance, and automated AI resolution assistant.
              </p>
            </div>

            {/* Platform Badges */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Enterprise RBAC with 7 User Roles</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Automated Root Cause Diagnosis</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-6 border-t border-slate-800/80 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Demo Accounts (Password: Password123!)
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@itsm.local')}
                className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition-colors flex items-center justify-between border border-slate-700/60"
              >
                <span>Super Admin (<code className="text-indigo-400">admin@itsm.local</code>)</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('manager@itsm.local')}
                className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition-colors flex items-center justify-between border border-slate-700/60"
              >
                <span>IT Manager (<code className="text-indigo-400">manager@itsm.local</code>)</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('agent@itsm.local')}
                className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition-colors flex items-center justify-between border border-slate-700/60"
              >
                <span>Service Desk Agent (<code className="text-indigo-400">agent@itsm.local</code>)</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('engineer@itsm.local')}
                className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition-colors flex items-center justify-between border border-slate-700/60"
              >
                <span>Infra Engineer (<code className="text-indigo-400">engineer@itsm.local</code>)</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('user@itsm.local')}
                className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition-colors flex items-center justify-between border border-slate-700/60"
              >
                <span>End User (<code className="text-indigo-400">user@itsm.local</code>)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 flex flex-col justify-center space-y-6 bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Sign in to ITOps AI</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your credentials to access the operations console.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@itsm.local"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("For demo reset, use password: Password123!"); }} className="text-[11px] text-indigo-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
              />
              <label htmlFor="remember" className="text-xs text-slate-400">Remember this console session</label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
