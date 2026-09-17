import { useState, useEffect } from 'react';
import { ShieldCheck, Activity, User as UserIcon, LogOut, Menu, KeyRound, Server } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function Navbar({ currentUser, onOpenAuth, onLogout, onToggleSidebar }: NavbarProps) {
  const [healthStatus, setHealthStatus] = useState<{ online: boolean; latencyMs: number }>({
    online: true,
    latencyMs: 18
  });
  const [env, setEnv] = useState<'Production' | 'Staging' | 'Sandbox'>('Production');

  // Periodic health check ping
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      const t0 = performance.now();
      try {
        await api.analytics.getHealth();
        const duration = Math.round(performance.now() - t0);
        if (mounted) {
          setHealthStatus({ online: true, latencyMs: duration });
        }
      } catch {
        if (mounted) {
          setHealthStatus({ online: false, latencyMs: 0 });
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs">
            <Server className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 tracking-tight text-base">
                Nexus REST Engine
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                v2.4 Core
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Real-time Health Ping */}
        <div
          id="status-health-pill"
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600"
          title="Live REST API backend health status"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              healthStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="font-medium text-zinc-700">
            {healthStatus.online ? `API Online (${healthStatus.latencyMs}ms)` : 'API Offline'}
          </span>
        </div>

        {/* Environment Badge */}
        <div className="hidden lg:flex items-center gap-1.5">
          <select
            id="select-env-scope"
            value={env}
            onChange={(e) => setEnv(e.target.value as any)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
          >
            <option value="Production">Env: Production</option>
            <option value="Staging">Env: Staging</option>
            <option value="Sandbox">Env: Sandbox</option>
          </select>
        </div>

        {/* User Account / Auth Trigger */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-900">{currentUser.name}</span>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                {currentUser.role}
              </span>
            </div>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-8 w-8 rounded-full border border-zinc-200 object-cover"
            />
            <button
              id="btn-nav-logout"
              onClick={onLogout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            id="btn-nav-login"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Sign In / Demo</span>
          </button>
        )}
      </div>
    </header>
  );
}
