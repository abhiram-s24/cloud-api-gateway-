import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { ProjectsView } from './components/ProjectsView';
import { ApiKeysView } from './components/ApiKeysView';
import { PlaygroundView } from './components/PlaygroundView';
import { LogsView } from './components/LogsView';
import { DocsView } from './components/DocsView';
import { AuthModal } from './components/AuthModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CreateKeyModal } from './components/CreateKeyModal';
import { ActiveTab, User, Project, ApiKey, ApiLog, AnalyticsData } from './types';
import { api, authStorage } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);

  // Quick navigation target for playground
  const [playgroundTargetEndpoint, setPlaygroundTargetEndpoint] = useState<string>('/api/projects');

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, analyticsRes, logsRes] = await Promise.all([
        api.projects.list(),
        api.analytics.getOverview().catch(() => null),
        api.logs.list({ limit: 40 }).catch(() => ({ success: true, count: 0, data: [] }))
      ]);

      if (projectsRes.success) setProjects(projectsRes.data);
      if (analyticsRes?.success) setAnalytics(analyticsRes.data);
      if (logsRes.success) setLogs(logsRes.data);

      // Fetch keys if user is logged in
      const savedUser = authStorage.getUser();
      if (savedUser) {
        try {
          const keysRes = await api.keys.list();
          if (keysRes.success) setApiKeys(keysRes.data);
        } catch {
          // not authorized or key expired
        }
      }
    } catch (err) {
      console.error('Failed to load gateway data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize session and data
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = authStorage.getUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      } else {
        // Automatically sign in as default Admin for seamless developer demo experience
        try {
          const res = await api.auth.login('admin@company.io', 'admin123');
          setCurrentUser(res.user);
        } catch {
          // ignore
        }
      }
      fetchData();
    };

    initializeAuth();

    // Auto-refresh analytics & logs every 10 seconds
    const interval = setInterval(() => {
      api.analytics.getOverview().then((res) => {
        if (res.success) setAnalytics(res.data);
      }).catch(() => {});

      api.logs.list({ limit: 40 }).then((res) => {
        if (res.success) setLogs(res.data);
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    setApiKeys([]);
    fetchData();
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    fetchData();
  };

  const handleTestInPlayground = (endpoint: string) => {
    setPlaygroundTargetEndpoint(endpoint);
    setActiveTab('playground');
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          currentUser={currentUser}
          hasActiveKey={apiKeys.some((k) => k.status === 'active')}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewView
              analytics={analytics}
              logs={logs}
              onRefresh={fetchData}
              onNavigate={setActiveTab}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
              onOpenCreateKey={() => setIsCreateKeyOpen(true)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onRefresh={fetchData}
              onOpenCreate={() => setIsCreateProjectOpen(true)}
              onTestInPlayground={handleTestInPlayground}
              isSuperAdmin={currentUser?.role === 'admin'}
            />
          )}

          {activeTab === 'keys' && (
            <ApiKeysView
              apiKeys={apiKeys}
              onRefresh={fetchData}
              onOpenCreate={() => setIsCreateKeyOpen(true)}
              onTestWithKey={(key) => {
                setPlaygroundTargetEndpoint('/api/projects');
                setActiveTab('playground');
              }}
              isSuperAdmin={currentUser?.role === 'admin'}
            />
          )}

          {activeTab === 'playground' && (
            <PlaygroundView
              apiKeys={apiKeys}
              currentUser={currentUser}
              initialEndpoint={playgroundTargetEndpoint}
            />
          )}

          {activeTab === 'logs' && (
            <LogsView
              logs={logs}
              onRefresh={fetchData}
              isSuperAdmin={currentUser?.role === 'admin'}
            />
          )}

          {activeTab === 'docs' && <DocsView />}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={() => fetchData()}
      />

      <CreateKeyModal
        isOpen={isCreateKeyOpen}
        onClose={() => setIsCreateKeyOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
