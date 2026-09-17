import { useState, type FormEvent } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'development'>('production');
  const [rateLimitTier, setRateLimitTier] = useState<'basic' | 'standard' | 'enterprise'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.projects.create({
        name,
        slug,
        description,
        environment,
        rateLimitTier
      });
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create microservice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-zinc-100 p-1.5 text-zinc-800">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Register New Microservice</h2>
              <p className="text-xs text-zinc-500">Configure endpoint route and traffic SLA tier</p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700">Service Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Billing & Invoicing Engine"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700">Route Slug</label>
            <div className="mt-1 flex rounded-lg border border-zinc-200 overflow-hidden text-xs">
              <span className="bg-zinc-100 px-2.5 py-1.5 font-mono text-zinc-500 select-none">
                /api/v1/
              </span>
              <input
                type="text"
                required
                placeholder="billing-v1"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-2.5 py-1.5 font-mono text-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of service capabilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700">Deployment Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700">Rate Limit Tier</label>
              <select
                value={rateLimitTier}
                onChange={(e) => setRateLimitTier(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
              >
                <option value="basic">Basic (60 req/min)</option>
                <option value="standard">Standard (300 req/min)</option>
                <option value="enterprise">Enterprise (1200 req/min)</option>
              </select>
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
              {isSubmitting ? 'Registering...' : 'Create Microservice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
