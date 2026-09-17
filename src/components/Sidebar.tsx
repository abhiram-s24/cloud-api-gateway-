import { LayoutDashboard, FolderGit2, KeyRound, TerminalSquare, ScrollText, BookOpen, X, Shield, Lock } from 'lucide-react';
import { ActiveTab, User } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser: User | null;
  hasActiveKey: boolean;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  hasActiveKey
}: SidebarProps) {
  const navItems = [
    {
      id: 'tab-overview',
      key: 'overview' as ActiveTab,
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'System health & metrics'
    },
    {
      id: 'tab-projects',
      key: 'projects' as ActiveTab,
      label: 'Microservices & Projects',
      icon: FolderGit2,
      description: 'REST resource CRUD'
    },
    {
      id: 'tab-keys',
      key: 'keys' as ActiveTab,
      label: 'API Keys & Access',
      icon: KeyRound,
      description: 'Secret tokens & RBAC'
    },
    {
      id: 'tab-playground',
      key: 'playground' as ActiveTab,
      label: 'REST API Playground',
      icon: TerminalSquare,
      description: 'Live interactive client'
    },
    {
      id: 'tab-logs',
      key: 'logs' as ActiveTab,
      label: 'Audit Logs & Traffic',
      icon: ScrollText,
      description: 'Live HTTP activity stream'
    },
    {
      id: 'tab-docs',
      key: 'docs' as ActiveTab,
      label: 'API Documentation',
      icon: BookOpen,
      description: 'Endpoints & SDK snippets'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 md:hidden">
          <span className="font-semibold text-zinc-900 text-sm">Navigation</span>
          <button
            id="btn-close-sidebar"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Platform Gateway
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={item.id}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900'
                  }`}
                />
                <div className="flex-1 truncate">
                  <div className="leading-tight">{item.label}</div>
                  <div
                    className={`text-[11px] font-normal truncate ${
                      isActive ? 'text-zinc-300' : 'text-zinc-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Security & Token status footer */}
        <div className="border-t border-zinc-200 p-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Authentication Context</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              {currentUser ? (
                <>
                  Logged in as <strong className="text-zinc-700">{currentUser.email}</strong> with <span className="uppercase text-emerald-600 font-semibold">{currentUser.role}</span> scope.
                </>
              ) : (
                <>
                  Anonymous mode. Generate or use API Keys in the REST Playground.
                </>
              )}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Lock className="h-3 w-3 text-zinc-400" />
              <span>TLS 1.3 / Bearer / SHA-256</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
