import { useState, type FormEvent } from 'react';
import { Plus, Search, Filter, FolderGit2, ExternalLink, Edit3, Trash2, Check, Clock, AlertCircle, Play, MoreVertical } from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';

interface ProjectsViewProps {
  projects: Project[];
  onRefresh: () => void;
  onOpenCreate: () => void;
  onTestInPlayground: (endpoint: string) => void;
  isSuperAdmin: boolean;
}

export function ProjectsView({
  projects,
  onRefresh,
  onOpenCreate,
  onTestInPlayground,
  isSuperAdmin
}: ProjectsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEnv, setEditEnv] = useState<'production' | 'staging' | 'development'>('development');
  const [editStatus, setEditStatus] = useState<'active' | 'maintenance' | 'deprecated'>('active');
  const [editTier, setEditTier] = useState<'basic' | 'standard' | 'enterprise'>('standard');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    const matchesEnv = selectedEnv === 'all' || p.environment === selectedEnv;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

    return matchesSearch && matchesEnv && matchesStatus;
  });

  const handleStartEdit = (p: Project) => {
    setEditingProject(p);
    setEditName(p.name);
    setEditDesc(p.description);
    setEditEnv(p.environment);
    setEditStatus(p.status);
    setEditTier(p.rateLimitTier);
    setErrorMsg(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.projects.update(editingProject.id, {
        name: editName,
        description: editDesc,
        environment: editEnv,
        status: editStatus,
        rateLimitTier: editTier
      });
      setEditingProject(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await api.projects.delete(id);
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: 'active' | 'maintenance' | 'deprecated') => {
    try {
      await api.projects.toggleStatus(id, newStatus);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Project button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Microservices & REST Resources
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your API resource endpoints, environment scopes, and rate limits.
          </p>
        </div>

        <button
          id="btn-create-project-open"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Microservice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            id="input-search-projects"
            type="text"
            placeholder="Search microservices by name, slug, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-filter-env"
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:border-zinc-300 focus:outline-none"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>

          <select
            id="select-filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:border-zinc-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <FolderGit2 className="mx-auto h-8 w-8 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">No services found</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Try adjusting your search criteria or register a new microservice.
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Microservice</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredProjects.map((p) => {
            const isProd = p.environment === 'production';
            const isStaging = p.environment === 'staging';

            return (
              <div
                key={p.id}
                id={`card-project-${p.id}`}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-colors"
              >
                <div>
                  {/* Top line with badges and actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-zinc-900">{p.name}</h3>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            isProd
                              ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20 ring-inset'
                              : isStaging
                              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 ring-inset'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {p.environment}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 ring-inset'
                              : p.status === 'maintenance'
                              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 ring-inset'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-zinc-500">
                        /api/v1/{p.slug}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-edit-proj-${p.id}`}
                        onClick={() => handleStartEdit(p)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                        title="Edit service properties"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        id={`btn-del-proj-${p.id}`}
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Metrics footer */}
                <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-zinc-500">
                    <div>
                      <span className="font-semibold text-zinc-900">{p.endpointCount}</span> endpoints
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900">{p.totalRequests.toLocaleString()}</span> calls
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900">{p.avgLatencyMs}ms</span> latency
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-test-proj-${p.id}`}
                      onClick={() => onTestInPlayground(`/api/projects/${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      <Play className="h-3 w-3 text-emerald-600" />
                      <span>Test REST API</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-zinc-900">Edit Microservice</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Update routing environment and SLA configuration.
            </p>

            {errorMsg && (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700">Service Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Environment</label>
                  <select
                    value={editEnv}
                    onChange={(e) => setEditEnv(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">Rate Limit Tier</label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
                >
                  <option value="basic">Basic (60 req/min)</option>
                  <option value="standard">Standard (300 req/min)</option>
                  <option value="enterprise">Enterprise (1200 req/min)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-zinc-900">Delete Microservice?</h2>
            <p className="mt-1 text-xs text-zinc-500">
              This will permanently remove the RESTful routing configuration and revoke associated access endpoints.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isSubmitting}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
