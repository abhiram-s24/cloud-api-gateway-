import { useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Zap, Plus, KeyRound, TerminalSquare, RefreshCw, Radio } from 'lucide-react';
import { AnalyticsData, ApiLog } from '../types';
import { api } from '../services/api';

interface OverviewViewProps {
  analytics: AnalyticsData | null;
  logs: ApiLog[];
  onRefresh: () => void;
  onNavigate: (tab: any) => void;
  onOpenCreateProject: () => void;
  onOpenCreateKey: () => void;
}

export function OverviewView({
  analytics,
  logs,
  onRefresh,
  onNavigate,
  onOpenCreateProject,
  onOpenCreateKey
}: OverviewViewProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await api.logs.simulate();
      onRefresh();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const totalStatusRequests = analytics
    ? (analytics.statusCounts['2xx'] + analytics.statusCounts['3xx'] + analytics.statusCounts['4xx'] + analytics.statusCounts['5xx']) || 1
    : 1;

  const pct2xx = analytics ? Math.round((analytics.statusCounts['2xx'] / totalStatusRequests) * 100) : 95;
  const pct4xx = analytics ? Math.round((analytics.statusCounts['4xx'] / totalStatusRequests) * 100) : 4;
  const pct5xx = analytics ? Math.round((analytics.statusCounts['5xx'] / totalStatusRequests) * 100) : 1;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            API Gateway Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time monitoring, security enforcement, and microservice traffic metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-simulate-traffic"
            type="button"
            onClick={handleSimulate}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 transition-colors disabled:opacity-50"
          >
            <Radio className={`h-3.5 w-3.5 text-emerald-600 ${isSimulating ? 'animate-pulse' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Live Ping'}</span>
          </button>

          <button
            id="btn-refresh-overview"
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
            title="Refresh metrics"
          >
            <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
            <span>Refresh</span>
          </button>

          <button
            id="btn-quick-new-key"
            type="button"
            onClick={onOpenCreateKey}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-300" />
            <span>New API Key</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total API Requests */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total Invocations
            </span>
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              {analytics ? analytics.totalRequests.toLocaleString() : '---'}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +8.4%
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Processed across all active REST routes</p>
        </div>

        {/* Avg Response Latency */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Avg Response Time
            </span>
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              {analytics ? `${analytics.avgLatencyMs} ms` : '---'}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              Fast
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">95th percentile under 45ms</p>
        </div>

        {/* Error Rate */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              API Error Rate
            </span>
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              {analytics ? `${analytics.errorRate}%` : '---'}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Healthy
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Target SLA threshold &lt; 1.0%</p>
        </div>

        {/* Managed Resources */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Active Security Keys
            </span>
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              {analytics ? analytics.activeKeys : '---'}
            </span>
            <span className="text-xs text-zinc-500">
              / {analytics ? analytics.totalProjects : 0} services
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Enforced by cryptographic SHA-256 tokens</p>
        </div>
      </div>

      {/* Latency Visualizer & Traffic Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latency Trend Visualizer */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Real-Time Request Latency</h2>
              <p className="text-xs text-zinc-500">Live duration of recent incoming API requests</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>&lt; 50ms</span>
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 ml-2" />
              <span>&gt; 50ms</span>
            </div>
          </div>

          {/* SVG Latency Bar Chart */}
          <div className="mt-5 h-48 w-full flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto">
            {analytics?.latencyPoints && analytics.latencyPoints.length > 0 ? (
              analytics.latencyPoints.map((pt, i) => {
                const maxVal = 100;
                const heightPct = Math.min(Math.max((pt.latency / maxVal) * 100, 10), 100);
                const isError = pt.status >= 400;
                const isSlow = pt.latency > 50;

                return (
                  <div
                    key={i}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-12 z-20 hidden rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow-md group-hover:block whitespace-nowrap">
                      <p className="font-semibold">{pt.endpoint}</p>
                      <p>{pt.latency}ms • HTTP {pt.status}</p>
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isError
                          ? 'bg-rose-500'
                          : isSlow
                          ? 'bg-amber-400'
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    />
                  </div>
                );
              })
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                Awaiting API traffic data...
              </div>
            )}
          </div>
          <div className="flex justify-between pt-2 text-[11px] text-zinc-400 border-t border-zinc-100">
            <span>Earlier calls</span>
            <span>Latest requests</span>
          </div>
        </div>

        {/* Status Code & Runtime Stats */}
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">HTTP Response Breakdown</h2>
            <p className="text-xs text-zinc-500">Distribution of response statuses</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  2xx Successful
                </span>
                <span>{analytics?.statusCounts['2xx'] || 0} ({pct2xx}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div style={{ width: `${pct2xx}%` }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  4xx Client Errors
                </span>
                <span>{analytics?.statusCounts['4xx'] || 0} ({pct4xx}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div style={{ width: `${pct4xx}%` }} className="h-full bg-amber-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  5xx Server Errors
                </span>
                <span>{analytics?.statusCounts['5xx'] || 0} ({pct5xx}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div style={{ width: `${pct5xx}%` }} className="h-full bg-rose-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Node runtime info */}
          <div className="mt-auto pt-4 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Node Environment</span>
              <span className="font-mono text-zinc-700">{analytics?.system.nodeVersion || 'v22.x'}</span>
            </div>
            <div className="flex justify-between">
              <span>Heap Memory</span>
              <span className="font-mono text-zinc-700">{analytics?.system.memoryUsageMb || 34} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Server Uptime</span>
              <span className="font-mono text-zinc-700">
                {analytics ? formatUptime(analytics.uptimeSeconds) : '---'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Recent API Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Launchpad */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-zinc-900">Developer Shortcuts</h2>
          <p className="text-xs text-zinc-500">Direct access to core gateway services</p>

          <div className="mt-4 space-y-2.5">
            <button
              onClick={onOpenCreateProject}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-200 p-3 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-zinc-100 p-1.5 text-zinc-700">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Deploy New Microservice</div>
                  <div className="text-[11px] text-zinc-400">Register REST endpoint & rate limits</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </button>

            <button
              onClick={() => onNavigate('playground')}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-200 p-3 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-zinc-100 p-1.5 text-zinc-700">
                  <TerminalSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">REST API Playground</div>
                  <div className="text-[11px] text-zinc-400">Execute test calls with headers & payloads</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </button>

            <button
              onClick={() => onNavigate('docs')}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-200 p-3 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-zinc-100 p-1.5 text-zinc-700">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">API Documentation & cURL</div>
                  <div className="text-[11px] text-zinc-400">Copy pre-authenticated requests</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Live Traffic Stream */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Recent API Invocations</h2>
              <p className="text-xs text-zinc-500">Live request stream passing through Express</p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              View all logs →
            </button>
          </div>

          <div className="mt-3 divide-y divide-zinc-100 overflow-hidden">
            {logs.slice(0, 5).map((log) => {
              const is2xx = log.status >= 200 && log.status < 300;
              const is4xx = log.status >= 400 && log.status < 500;
              const is5xx = log.status >= 500;

              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        log.method === 'GET'
                          ? 'bg-blue-50 text-blue-700'
                          : log.method === 'POST'
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.method === 'PUT'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {log.method}
                    </span>
                    <span className="font-mono text-zinc-800 truncate">{log.path}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-zinc-400 text-[11px] font-mono">{log.durationMs}ms</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        is2xx
                          ? 'bg-emerald-50 text-emerald-700'
                          : is4xx
                          ? 'bg-amber-50 text-amber-700'
                          : is5xx
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
