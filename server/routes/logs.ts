import { Router } from 'express';
import { store } from '../store';
import { AuthenticatedRequest, requireAuth, requireScope } from '../middleware/auth';

const router = Router();

// GET /api/logs
router.get('/', requireAuth, (req, res) => {
  const { severity, search, limit = 50 } = req.query;

  let logs = [...store.logs];

  if (severity && severity !== 'all') {
    logs = logs.filter(l => l.severity === severity);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(l =>
      l.path.toLowerCase().includes(q) ||
      l.method.toLowerCase().includes(q) ||
      l.caller.toLowerCase().includes(q) ||
      l.status.toString().includes(q)
    );
  }

  const max = Math.min(Number(limit) || 50, 100);

  res.json({
    success: true,
    count: logs.length,
    data: logs.slice(0, max)
  });
});

// DELETE /api/logs (clear logs)
router.delete('/', requireAuth, requireScope('admin'), (req: AuthenticatedRequest, res) => {
  store.logs = [];
  res.json({ success: true, message: 'Audit logs cleared successfully.' });
});

// POST /api/logs/simulate (generate sample traffic)
router.post('/simulate', (req, res) => {
  const sampleEndpoints = [
    { method: 'GET', path: '/api/projects', status: 200 },
    { method: 'POST', path: '/api/projects', status: 201 },
    { method: 'GET', path: '/api/analytics/overview', status: 200 },
    { method: 'GET', path: '/api/keys', status: 200 },
    { method: 'POST', path: '/api/auth/login', status: Math.random() > 0.8 ? 401 : 200 },
    { method: 'GET', path: '/api/v1/protected/metrics', status: Math.random() > 0.85 ? 403 : 200 }
  ];

  const pick = sampleEndpoints[Math.floor(Math.random() * sampleEndpoints.length)];
  const durationMs = Math.floor(Math.random() * 45) + 10;
  const status = pick.status;
  const severity = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

  const entry = store.addLog({
    method: pick.method,
    path: pick.path,
    status,
    durationMs,
    ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
    userAgent: 'REST-TrafficSimulator/1.2',
    authMethod: Math.random() > 0.5 ? 'api-key' : 'bearer',
    caller: Math.random() > 0.5 ? 'sk_live_...' : 'developer@service.net',
    severity
  });

  res.json({ success: true, data: entry });
});

export default router;
