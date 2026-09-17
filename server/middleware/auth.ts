import { Request, Response, NextFunction } from 'express';
import { store, User, ApiKey } from '../store';

export interface AuthenticatedRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
  authMethod?: 'bearer' | 'api-key' | 'anonymous';
  callerIdentifier?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  // 1. Check API Key header
  if (apiKeyHeader) {
    const hashed = store.hashApiKey(apiKeyHeader);
    let matchedKey: ApiKey | undefined;

    for (const key of store.apiKeys.values()) {
      if (key.hashedKey === hashed && key.status === 'active') {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      matchedKey.usageCount++;
      matchedKey.lastUsedAt = new Date().toISOString();
      req.apiKey = matchedKey;
      req.authMethod = 'api-key';
      req.callerIdentifier = matchedKey.keyPrefix;
      return next();
    }
  }

  // 2. Check Bearer Session Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();

    // Check sessions
    const session = store.sessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      const user = store.users.get(session.userId);
      if (user) {
        req.user = user;
        req.authMethod = 'bearer';
        req.callerIdentifier = user.email;
        return next();
      }
    }

    // Also allow raw API key passed in Authorization: Bearer sk_...
    if (token.startsWith('sk_')) {
      const hashed = store.hashApiKey(token);
      let matchedKey: ApiKey | undefined;

      for (const key of store.apiKeys.values()) {
        if (key.hashedKey === hashed && key.status === 'active') {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        matchedKey.usageCount++;
        matchedKey.lastUsedAt = new Date().toISOString();
        req.apiKey = matchedKey;
        req.authMethod = 'api-key';
        req.callerIdentifier = matchedKey.keyPrefix;
        return next();
      }
    }
  }

  req.authMethod = 'anonymous';
  req.callerIdentifier = req.ip || 'anonymous';
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user && !req.apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid Bearer token or x-api-key header.',
      statusCode: 401
    });
  }
  next();
}

export function requireScope(scope: 'read' | 'write' | 'admin') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // If logged in as user session
    if (req.user) {
      if (scope === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin permissions required for this action.',
          statusCode: 403
        });
      }
      return next();
    }

    // If authenticated via API Key
    if (req.apiKey) {
      if (!req.apiKey.scopes.includes(scope) && !req.apiKey.scopes.includes('admin')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `API Key lacks required scope: '${scope}'. Current scopes: ${req.apiKey.scopes.join(', ')}`,
          statusCode: 403
        });
      }
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication credentials missing.',
      statusCode: 401
    });
  };
}
