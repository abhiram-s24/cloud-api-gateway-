import { Router } from 'express';
import os from 'os';
import { store } from '../store';

const router = Router();

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - store.startTime) / 1000);
  const totalReq = Math.max(store.requestCount, 1);
  const avgLatency = Math.round((store.totalLatencyMs / totalReq) * 10) / 10;
  const errorRate = Math.round((store.errorCount / totalReq) * 10000) / 100;

  // Status breakdown
  const statusCounts = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0
  };

  store.logs.forEach(l => {
    if (l.status >= 200 && l.status < 300) statusCounts['2xx']++;
    else if (l.status >= 300 && l.status < 400) statusCounts['3xx']++;
    else if (l.status >= 400 && l.status < 500) statusCounts['4xx']++;
    else if (l.status >= 500) statusCounts['5xx']++;
  });

  // Recent 12 intervals latency data
  const recentLogs = store.logs.slice(0, 30);
  const latencyPoints = recentLogs.map((log, index) => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    latency: log.durationMs,
    status: log.status,
    endpoint: log.path
  })).reverse();

  // Active resource counts
  const totalProjects = store.projects.size;
  const activeKeys = Array.from(store.apiKeys.values()).filter(k => k.status === 'active').length;
  const totalUsers = store.users.size;

  res.json({
    success: true,
    data: {
      uptimeSeconds,
      totalRequests: store.requestCount,
      errorRate,
      avgLatencyMs: avgLatency || 24,
      statusCounts,
      totalProjects,
      activeKeys,
      totalUsers,
      latencyPoints,
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        nodeVersion: process.version,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
        cpuCount: os.cpus().length
      }
    }
  });
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - store.startTime) / 1000),
    service: 'RESTful API Engine',
    version: '2.4.0'
  });
});

export default router;
