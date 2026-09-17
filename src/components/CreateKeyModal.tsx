import { useState, type FormEvent } from 'react';
import { X, KeyRound, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { ApiKey } from '../types';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: ApiKey) => void;
}

export function CreateKeyModal({ isOpen, onClose, onSuccess }: CreateKeyModalProps) {
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'development'>('production');
  const [rateLimit, setRateLimit] = useState<number>(300);
  const [scopes, setScopes] = useState<('read' | 'write' | 'admin')[]>(['read', 'write']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Once generated:
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const toggleScope = (scope: 'read' | 'write' | 'admin') => {
    if (scopes.includes(scope)) {
      if (scopes.length === 1) return; // keep at least 1 scope
      setScopes(scopes.filter((s) => s !== scope));
    } else {
      setScopes([...scopes, scope]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.keys.create({
        name,
        environment,
        rateLimit,
        scopes
      });
      setGeneratedKey(res.data);
      onSuccess(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (generatedKey?.fullKey) {
      navigator.clipboard.writeText(generatedKey.fullKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDone = () => {
    setGeneratedKey(null);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-zinc-100 p-1.5 text-zinc-800">
              <KeyRound className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {generatedKey ? 'API Key Generated' : 'Generate Secret API Key'}
              </h2>
              <p className="text-xs text-zinc-500">
                {generatedKey ? 'Store key securely before closing' : 'Provision token with fine-grained RBAC scopes'}
              </p>
            </div>
          </div>
          <button
            onClick={generatedKey ? handleDone : onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {generatedKey ? (
          /* Secret Key Display State */
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>Important:</strong> Copy your API key now. For your security, this full token is only revealed once and cannot be retrieved again later.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Your API Secret Key</label>
              <div className="flex items-center rounded-lg border border-zinc-300 bg-zinc-900 p-2.5">
                <input
                  type="text"
                  readOnly
                  value={generatedKey.fullKey || ''}
                  className="flex-1 bg-transparent font-mono text-xs text-emerald-400 outline-none select-all"
                />
                <button
                  type="button"
                  id="btn-copy-secret-key"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 space-y-1">
              <div><strong>Key Name:</strong> {generatedKey.name}</div>
              <div><strong>Scopes:</strong> {generatedKey.scopes.join(', ')}</div>
              <div><strong>Environment:</strong> {generatedKey.environment}</div>
            </div>

            <button
              type="button"
              onClick={handleDone}
              className="w-full rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              I have saved my secret key
            </button>
          </div>
        ) : (
          /* Key Generation Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700">Key Name / Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g., Stripe Webhook Worker"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
                >
                  <option value="production">Production (sk_live_)</option>
                  <option value="staging">Staging (sk_test_)</option>
                  <option value="development">Development (sk_test_)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">Rate Limit (req/min)</label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">RBAC Scopes & Permissions</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'read', label: 'Read Data', desc: 'GET calls' },
                  { key: 'write', label: 'Write Data', desc: 'POST/PUT' },
                  { key: 'admin', label: 'Admin', desc: 'Key/User mgmt' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleScope(item.key as any)}
                    className={`rounded-lg border p-2 text-left transition-colors ${
                      scopes.includes(item.key as any)
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-75">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Generating...' : 'Create API Key'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
