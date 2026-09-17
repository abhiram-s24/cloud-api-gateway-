import { Router } from 'express';
import crypto from 'crypto';
import { store, Project } from '../store';
import { AuthenticatedRequest, requireAuth, requireScope } from '../middleware/auth';

const router = Router();

// GET /api/projects (filter by status, environment, search)
router.get('/', (req, res) => {
  const { status, environment, search } = req.query;

  let list = Array.from(store.projects.values());

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(p => p.status === status);
  }

  if (environment && typeof environment === 'string' && environment !== 'all') {
    list = list.filter(p => p.environment === environment);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  // Sort by updatedAt descending
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json({
    success: true,
    count: list.length,
    data: list
  });
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = store.projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Project with ID '${req.params.id}' not found.`,
      statusCode: 404
    });
  }
  res.json({ success: true, data: project });
});

// POST /api/projects
router.post('/', requireAuth, requireScope('write'), (req: AuthenticatedRequest, res) => {
  const { name, slug, description, environment = 'development', status = 'active', rateLimitTier = 'standard' } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Project name is required.'
    });
  }

  const generatedSlug = slug
    ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);

  // Check unique slug
  const existingWithSlug = Array.from(store.projects.values()).find(p => p.slug === generatedSlug);
  if (existingWithSlug) {
    return res.status(409).json({
      error: 'Conflict',
      message: `A project with slug '${generatedSlug}' already exists.`
    });
  }

  const newProject: Project = {
    id: 'proj_' + crypto.randomUUID().slice(0, 8),
    name: name.trim(),
    slug: generatedSlug,
    description: description ? description.trim() : 'Microservice endpoint managed by REST dashboard.',
    environment: ['production', 'staging', 'development'].includes(environment) ? environment : 'development',
    status: ['active', 'maintenance', 'deprecated'].includes(status) ? status : 'active',
    rateLimitTier: ['basic', 'standard', 'enterprise'].includes(rateLimitTier) ? rateLimitTier : 'standard',
    endpointCount: Math.floor(Math.random() * 8) + 2,
    totalRequests: 0,
    errorRate: 0.0,
    avgLatencyMs: Math.floor(Math.random() * 30) + 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.projects.set(newProject.id, newProject);

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: newProject
  });
});

// PUT /api/projects/:id
router.put('/:id', requireAuth, requireScope('write'), (req: AuthenticatedRequest, res) => {
  const project = store.projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Project with ID '${req.params.id}' not found.`
    });
  }

  const { name, description, environment, status, rateLimitTier } = req.body;

  if (name) project.name = name.trim();
  if (description !== undefined) project.description = description.trim();
  if (environment && ['production', 'staging', 'development'].includes(environment)) {
    project.environment = environment;
  }
  if (status && ['active', 'maintenance', 'deprecated'].includes(status)) {
    project.status = status;
  }
  if (rateLimitTier && ['basic', 'standard', 'enterprise'].includes(rateLimitTier)) {
    project.rateLimitTier = rateLimitTier;
  }
  project.updatedAt = new Date().toISOString();

  store.projects.set(project.id, project);

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: project
  });
});

// PATCH /api/projects/:id/status
router.patch('/:id/status', requireAuth, requireScope('write'), (req: AuthenticatedRequest, res) => {
  const project = store.projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Not Found', message: 'Project not found' });
  }

  const { status } = req.body;
  if (!['active', 'maintenance', 'deprecated'].includes(status)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid status' });
  }

  project.status = status;
  project.updatedAt = new Date().toISOString();
  store.projects.set(project.id, project);

  res.json({ success: true, data: project });
});

// DELETE /api/projects/:id
router.delete('/:id', requireAuth, requireScope('admin'), (req: AuthenticatedRequest, res) => {
  const exists = store.projects.has(req.params.id);
  if (!exists) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Project with ID '${req.params.id}' not found.`
    });
  }

  store.projects.delete(req.params.id);

  res.json({
    success: true,
    message: `Project '${req.params.id}' deleted successfully.`
  });
});

export default router;
