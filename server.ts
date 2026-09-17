import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './server/middleware/auth';
import { requestLogger } from './server/middleware/logger';
import { rateLimiter } from './server/middleware/ratelimit';
import authRoutes from './server/routes/auth';
import projectRoutes from './server/routes/projects';
import keyRoutes from './server/routes/keys';
import analyticsRoutes from './server/routes/analytics';
import logRoutes from './server/routes/logs';
import testRoutes from './server/routes/test';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Extract auth context, rate limit, and log API traffic
  app.use(authMiddleware);
  app.use('/api', rateLimiter);
  app.use(requestLogger);

  // Mount RESTful API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/keys', keyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/test', testRoutes);

  // Standard health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'RESTful API Server', timestamp: new Date().toISOString() });
  });

  // 404 handler for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `REST API endpoint ${req.method} ${req.originalUrl} does not exist.`,
      statusCode: 404
    });
  });

  // Vite middleware for frontend development / production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred on the server.',
      statusCode: err.status || 500
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RESTful API server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
