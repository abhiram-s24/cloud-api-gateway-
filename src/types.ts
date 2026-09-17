export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  avatar: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  scopes: ('read' | 'write' | 'admin')[];
  environment: 'production' | 'staging' | 'development';
  rateLimit: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'revoked';
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  environment: 'production' | 'staging' | 'development';
  status: 'active' | 'maintenance' | 'deprecated';
  rateLimitTier: 'basic' | 'standard' | 'enterprise';
  endpointCount: number;
  totalRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string;
  userAgent: string;
  authMethod: 'bearer' | 'api-key' | 'anonymous';
  caller: string;
  severity: 'info' | 'warn' | 'error';
}

export interface AnalyticsData {
  uptimeSeconds: number;
  totalRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  statusCounts: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  totalProjects: number;
  activeKeys: number;
  totalUsers: number;
  latencyPoints: Array<{
    time: string;
    latency: number;
    status: number;
    endpoint: string;
  }>;
  system: {
    platform: string;
    architecture: string;
    nodeVersion: string;
    memoryUsageMb: number;
    totalMemoryMb: number;
    freeMemoryMb: number;
    cpuCount: number;
  };
}

export type ActiveTab = 'overview' | 'projects' | 'keys' | 'playground' | 'logs' | 'docs';
