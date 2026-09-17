import { Router } from 'express';
import crypto from 'crypto';
import { store, ApiKey } from '../store';
import { AuthenticatedRequest, requireAuth, requireScope } from '../middleware/auth';

const router = Router();

// GET /api/keys
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const keys = Array.from(store.apiKeys.values()).map(k => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    scopes: k.scopes,
    environment: k.environment,
    rateLimit: k.rateLimit,
    usageCount: k.usageCount,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
    createdBy: k.createdBy,
    status: k.status
  }));

  res.json({
    success: true,
    count: keys.length,
    data: keys
  });
});

// POST /api/keys (generate new key)
router.post('/', requireAuth, requireScope('admin'), (req: AuthenticatedRequest, res) => {
  const { name, scopes = ['read'], environment = 'development', rateLimit = 60 } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'API Key name is required.'
    });
  }

  const prefix = environment === 'production' ? 'sk_live_' : 'sk_test_';
  const secret = crypto.randomBytes(24).toString('hex');
  const fullKey = `${prefix}${secret}`;
  const hashedKey = store.hashApiKey(fullKey);

  const newKey: ApiKey = {
    id: 'key_' + crypto.randomUUID().slice(0, 8),
    name: name.trim(),
    keyPrefix: `${prefix}${secret.slice(0, 4)}...${secret.slice(-4)}`,
    hashedKey,
    fullKey, // Return this once to the creator
    scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ['read'],
    environment: ['production', 'staging', 'development'].includes(environment) ? environment : 'development',
    rateLimit: Number(rateLimit) || 60,
    usageCount: 0,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    createdBy: req.user ? req.user.email : 'System Admin',
    status: 'active'
  };

  store.apiKeys.set(newKey.id, newKey);

  res.status(201).json({
    success: true,
    message: 'API Key generated. Copy your full key now; you will not be able to view it again.',
    data: newKey
  });
});

// PATCH /api/keys/:id/revoke
router.patch('/:id/revoke', requireAuth, requireScope('admin'), (req: AuthenticatedRequest, res) => {
  const key = store.apiKeys.get(req.params.id);
  if (!key) {
    return res.status(404).json({ error: 'Not Found', message: 'API Key not found.' });
  }

  key.status = 'revoked';
  store.apiKeys.set(key.id, key);

  res.json({
    success: true,
    message: `API Key '${key.name}' was revoked.`,
    data: key
  });
});

// DELETE /api/keys/:id
router.delete('/:id', requireAuth, requireScope('admin'), (req: AuthenticatedRequest, res) => {
  const exists = store.apiKeys.has(req.params.id);
  if (!exists) {
    return res.status(404).json({ error: 'Not Found', message: 'API Key not found.' });
  }

  store.apiKeys.delete(req.params.id);

  res.json({
    success: true,
    message: `API Key '${req.params.id}' was deleted.`
  });
});

export default router;
