import { Router } from 'express';
import { AuthenticatedRequest, requireAuth, requireScope } from '../middleware/auth';

const router = Router();

// Universal Echo endpoint to test payloads, headers, methods
router.all('/echo', (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    message: 'Echo response from REST API engine',
    receivedAt: new Date().toISOString(),
    method: req.method,
    headers: {
      host: req.headers.host,
      authorization: req.headers.authorization ? 'Bearer [PRESENT]' : undefined,
      'x-api-key': req.headers['x-api-key'] ? 'Key [PRESENT]' : undefined,
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    },
    query: req.query,
    body: req.body,
    authContext: {
      authMethod: req.authMethod,
      caller: req.callerIdentifier,
      user: req.user ? { name: req.user.name, email: req.user.email, role: req.user.role } : null,
      apiKey: req.apiKey ? { id: req.apiKey.id, name: req.apiKey.name, scopes: req.apiKey.scopes } : null
    }
  });
});

// Secure protected test endpoint (Requires Auth)
router.get('/secure-data', requireAuth, requireScope('read'), (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    message: 'Authenticated request granted.',
    data: {
      confidentialVaultId: 'vault_9420x_alpha',
      encryptionStandard: 'AES-256-GCM',
      accessGrantedTo: req.callerIdentifier,
      authMethod: req.authMethod,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
