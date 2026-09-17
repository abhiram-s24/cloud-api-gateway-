import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { store } from '../store';

export function requestLogger(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const start = Date.now();

  // Intercept end to capture status code and duration
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    
    // Ignore internal static file loads in log history if needed, only log /api routes
    if (req.originalUrl.startsWith('/api')) {
      const severity = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      
      store.addLog({
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status,
        durationMs,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown Agent',
        authMethod: req.authMethod || 'anonymous',
        caller: req.callerIdentifier || 'anonymous',
        severity
      });
    }
  });

  next();
}
