import { useState } from 'react';
import { KeyRound, Plus, ShieldCheck, Copy, Check, Trash2, Ban, AlertTriangle, ShieldAlert, Terminal, Lock } from 'lucide-react';
import { ApiKey } from '../types';
import { api } from '../services/api';

interface ApiKeysViewProps {
  apiKeys: ApiKey[];
  onRefresh: () => void;
  onOpenCreate: () => void;
  onTestWithKey: (key: string) => void;
  isSuperAdmin: boolean;
}

export function ApiKeysView({
  apiKeys,
  onRefresh,
  onOpenCreate,
  onTestWithKey,
  isSuperAdmin
}: ApiKeysViewProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will immediately be rejected with 401 Unauthorized.')) {
      return;
    }
    setIsProcessing(true);
    try {
      await api.keys.revoke(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke key');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this key record permanently?')) {
      return;
    }
    setIsProcessing(true);
    try {
      await api.keys.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete key');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            API Keys & Authentication
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Generate and manage cryptographically secured API keys for external service authorization.
          </p>
        </div>

        <button
          id="btn-generate-key-modal"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      {/* Security Best Practices Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold text-amber-900">API Key Security Notice:</span> Your secret keys grant direct programmatic access to your RESTful resources. Store them securely in environment variables (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">x-api-key</code> or <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code>) and never commit keys to public git repositories.
          </div>
        </div>
      </div>

      {/* Keys Table Container */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3">Key Name</th>
                <th className="px-5 py-3">Token Prefix</th>
                <th className="px-5 py-3">Scopes</th>
                <th className="px-5 py-3">Environment</th>
                <th className="px-5 py-3">Rate Limit</th>
                <th className="px-5 py-3">Invocations</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-400">
                    No active API keys found. Click "Generate API Key" to provision your first token.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => {
                  const isRevoked = key.status === 'revoked';
                  const isCopied = copiedKeyId === key.id;

                  return (
                    <tr
                      key={key.id}
                      id={`row-key-${key.id}`}
                      className="hover:bg-zinc-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{key.name}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Created by {key.createdBy}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-700">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            {key.keyPrefix}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map((s) => (
                            <span
                              key={s}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                s === 'admin'
                                  ? 'bg-rose-50 text-rose-700'
                                  : s === 'write'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                            key.environment === 'production'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {key.environment}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-zinc-700">
                        {key.rateLimit} req/min
                      </td>

                      <td className="px-5 py-3.5 font-mono text-zinc-700">
                        {key.usageCount.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isRevoked
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isRevoked ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          {key.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isRevoked && (
                            <button
                              id={`btn-revoke-key-${key.id}`}
                              onClick={() => handleRevoke(key.id)}
                              disabled={isProcessing}
                              className="rounded-lg p-1 text-zinc-400 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              title="Revoke key access"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            id={`btn-del-key-${key.id}`}
                            onClick={() => handleDelete(key.id)}
                            disabled={isProcessing}
                            className="rounded-lg p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
