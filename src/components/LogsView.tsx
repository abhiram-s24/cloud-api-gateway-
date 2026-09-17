import { useState } from 'react';
import { ScrollText, Search, Filter, Trash2, Radio, RefreshCw, Eye, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ApiLog } from '../types';
import { api } from '../services/api';

interface LogsViewProps {
  logs: ApiLog[];
  onRefresh: () => void;
  isSuperAdmin: boolean;
}

export function LogsView({ logs, onRefresh, isSuperAdmin }: LogsViewProps) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.path.toLowerCase().includes(search.toLowerCase()) ||
      log.method.toLowerCase().includes(search.toLowerCase()) ||
      log.caller.toLowerCase().includes(search.toLowerCase()) ||
      log.status.toString().includes(search);

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await api.logs.simulate();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all server audit logs?')) return;
    setIsClearing(true);
    try {
      await api.logs.clear();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to clear logs');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Audit Logs & Traffic Stream
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time audit trail of all RESTful requests, security verifications, and HTTP responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-simulate-log"
            onClick={handleSimulate}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50"
          >
            <Radio className={`h-3.5 w-3.5 text-emerald-600 ${isSimulating ? 'animate-pulse' : ''}`} />
            <span>Simulate Traffic</span>
          </button>

          <button
            id="btn-refresh-logs"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
            title="Refresh logs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
            <span>Refresh</span>
          </button>

          <button
            id="btn-clear-logs"
            onClick={handleClear}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 shadow-2xs hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            id="input-search-logs"
            type="text"
            placeholder="Search logs by path, method, caller ID, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <select
          id="select-filter-severity"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:border-zinc-300 focus:outline-none"
        >
          <option value="all">All Severities</option>
          <option value="info">Info (2xx/3xx)</option>
          <option value="warn">Warning (4xx)</option>
          <option value="error">Error (5xx)</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Route Path</th>
                <th className="px-5 py-3">HTTP Status</th>
                <th className="px-5 py-3">Latency</th>
                <th className="px-5 py-3">Auth Context</th>
                <th className="px-5 py-3">Caller Identity</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-400 font-sans">
                    No log events match your current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const is2xx = log.status >= 200 && log.status < 300;
                  const is4xx = log.status >= 400 && log.status < 500;
                  const is5xx = log.status >= 500;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-5 py-3 text-[11px] text-zinc-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
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
                      </td>

                      <td className="px-5 py-3 text-zinc-900 font-semibold max-w-xs truncate">
                        {log.path}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      </td>

                      <td className="px-5 py-3 text-zinc-500 text-[11px]">
                        {log.durationMs}ms
                      </td>

                      <td className="px-5 py-3 font-sans">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                            log.authMethod === 'bearer'
                              ? 'bg-purple-50 text-purple-700'
                              : log.authMethod === 'api-key'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {log.authMethod}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-zinc-600 text-[11px] truncate max-w-xs">
                        {log.caller}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="rounded p-1 text-zinc-400 hover:text-zinc-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    selectedLog.method === 'GET'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {selectedLog.method}
                </span>
                <span className="font-mono text-sm font-semibold text-zinc-900">
                  {selectedLog.path}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-zinc-50 p-3">
                <span className="text-zinc-400 block mb-1 font-sans">HTTP Response Status</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {selectedLog.status}
                </span>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3">
                <span className="text-zinc-400 block mb-1 font-sans">Execution Latency</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {selectedLog.durationMs} ms
                </span>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3">
                <span className="text-zinc-400 block mb-1 font-sans">Auth Security Mode</span>
                <span className="font-mono font-semibold text-zinc-900">
                  {selectedLog.authMethod}
                </span>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3">
                <span className="text-zinc-400 block mb-1 font-sans">Caller Identifier</span>
                <span className="font-mono text-zinc-900 truncate block">
                  {selectedLog.caller}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300 font-mono space-y-1">
              <div><span className="text-zinc-500">IP:</span> {selectedLog.ip}</div>
              <div><span className="text-zinc-500">Timestamp:</span> {selectedLog.timestamp}</div>
              <div className="truncate"><span className="text-zinc-500">User Agent:</span> {selectedLog.userAgent}</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
