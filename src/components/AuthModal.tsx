import { useState, type FormEvent } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'developer'>('developer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.login(demoEmail, demoPass);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (tab === 'login') {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.register(name, email, password, role);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">REST API Gateway Authentication</h2>
            <p className="text-xs text-zinc-500">Sign in to manage API keys, scopes, and microservices</p>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 space-y-2">
          <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Instant 1-Click Demo Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              id="btn-demo-admin"
              onClick={() => handleQuickDemo('admin@company.io', 'admin123')}
              disabled={isLoading}
              className="flex flex-col text-left rounded-lg border border-emerald-200 bg-white p-2.5 hover:border-emerald-300 hover:shadow-2xs transition-all disabled:opacity-50"
            >
              <span className="text-xs font-bold text-zinc-900">Alex Chen</span>
              <span className="text-[11px] font-medium text-emerald-700 uppercase">Role: Admin</span>
            </button>

            <button
              type="button"
              id="btn-demo-dev"
              onClick={() => handleQuickDemo('dev@company.io', 'dev123')}
              disabled={isLoading}
              className="flex flex-col text-left rounded-lg border border-emerald-200 bg-white p-2.5 hover:border-emerald-300 hover:shadow-2xs transition-all disabled:opacity-50"
            >
              <span className="text-xs font-bold text-zinc-900">Sarah Connor</span>
              <span className="text-[11px] font-medium text-blue-700 uppercase">Role: Developer</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700">Full Name</label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Vance"
                  className="w-full rounded-lg border border-zinc-200 pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.io"
                className="w-full rounded-lg border border-zinc-200 pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-200 pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
              >
                <option value="developer">Developer (Read/Write)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <span>{isLoading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
