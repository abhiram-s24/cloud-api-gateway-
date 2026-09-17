import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  avatar: string;
  createdAt: string;
  passwordHash: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  fullKey?: string; // only returned once on creation
  scopes: ('read' | 'write' | 'admin')[];
  environment: 'production' | 'staging' | 'development';
  rateLimit: number; // requests per minute
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
  errorRate: number; // percentage
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

// Initial in-memory database with persistent state across process life
class Store {
  users: Map<string, User> = new Map();
  apiKeys: Map<string, ApiKey> = new Map();
  projects: Map<string, Project> = new Map();
  logs: ApiLog[] = [];
  sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  // Metrics
  startTime: number = Date.now();
  requestCount: number = 0;
  errorCount: number = 0;
  totalLatencyMs: number = 0;

  constructor() {
    this.seed();
  }

  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  seed() {
    // Seed Users
    const adminUser: User = {
      id: 'usr_admin',
      name: 'Alex Chen',
      email: 'admin@company.io',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      passwordHash: this.hashPassword('admin123')
    };

    const devUser: User = {
      id: 'usr_dev',
      name: 'Sarah Connor',
      email: 'dev@company.io',
      role: 'developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      passwordHash: this.hashPassword('dev123')
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(devUser.id, devUser);

    // Seed Demo API Keys
    const defaultRawKey1 = 'sk_live_' + crypto.randomBytes(16).toString('hex');
    const defaultRawKey2 = 'sk_test_' + crypto.randomBytes(16).toString('hex');

    const key1: ApiKey = {
      id: 'key_live_core',
      name: 'Production Server Client',
      keyPrefix: defaultRawKey1.substring(0, 12) + '...',
      hashedKey: this.hashApiKey(defaultRawKey1),
      fullKey: defaultRawKey1,
      scopes: ['read', 'write', 'admin'],
      environment: 'production',
      rateLimit: 1200,
      usageCount: 84920,
      lastUsedAt: new Date(Date.now() - 120000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      createdBy: adminUser.email,
      status: 'active'
    };

    const key2: ApiKey = {
      id: 'key_test_sandbox',
      name: 'Sandbox Integration Key',
      keyPrefix: defaultRawKey2.substring(0, 12) + '...',
      hashedKey: this.hashApiKey(defaultRawKey2),
      fullKey: defaultRawKey2,
      scopes: ['read', 'write'],
      environment: 'staging',
      rateLimit: 300,
      usageCount: 1420,
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      createdBy: devUser.email,
      status: 'active'
    };

    this.apiKeys.set(key1.id, key1);
    this.apiKeys.set(key2.id, key2);

    // Seed Projects
    const projects: Project[] = [
      {
        id: 'proj_payment_gateway',
        name: 'Payment & Checkout Service',
        slug: 'checkout-v2',
        description: 'Secure tokenized checkout and billing pipeline with webhook callbacks.',
        environment: 'production',
        status: 'active',
        rateLimitTier: 'enterprise',
        endpointCount: 14,
        totalRequests: 142980,
        errorRate: 0.12,
        avgLatencyMs: 42,
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_auth_identity',
        name: 'Identity & Access Manager',
        slug: 'auth-idm',
        description: 'Multi-tenant authentication, session management, and RBAC policies.',
        environment: 'production',
        status: 'active',
        rateLimitTier: 'enterprise',
        endpointCount: 9,
        totalRequests: 320140,
        errorRate: 0.04,
        avgLatencyMs: 28,
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_telemetry',
        name: 'Event Ingestion Stream',
        slug: 'event-stream',
        description: 'High-throughput time-series event ingestion and streaming buffer.',
        environment: 'staging',
        status: 'active',
        rateLimitTier: 'standard',
        endpointCount: 6,
        totalRequests: 89400,
        errorRate: 0.85,
        avgLatencyMs: 19,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_notifications',
        name: 'Omnichannel Dispatcher',
        slug: 'notify-dispatcher',
        description: 'Transactional SMS, push notification and transactional email worker.',
        environment: 'development',
        status: 'maintenance',
        rateLimitTier: 'basic',
        endpointCount: 5,
        totalRequests: 1240,
        errorRate: 2.1,
        avgLatencyMs: 65,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    projects.forEach(p => this.projects.set(p.id, p));

    // Seed recent logs
    const endpoints = [
      { method: 'GET', path: '/api/projects', status: 200, dur: 18, sev: 'info' as const },
      { method: 'POST', path: '/api/auth/login', status: 200, dur: 45, sev: 'info' as const },
      { method: 'GET', path: '/api/keys', status: 200, dur: 22, sev: 'info' as const },
      { method: 'GET', path: '/api/projects/proj_payment_gateway', status: 200, dur: 14, sev: 'info' as const },
      { method: 'POST', path: '/api/projects', status: 201, dur: 38, sev: 'info' as const },
      { method: 'GET', path: '/api/projects/invalid-id', status: 404, dur: 8, sev: 'warn' as const },
      { method: 'POST', path: '/api/auth/login', status: 401, dur: 25, sev: 'warn' as const }
    ];

    for (let i = 0; i < 25; i++) {
      const ep = endpoints[i % endpoints.length];
      const timestamp = new Date(Date.now() - (25 - i) * 60000 * 3).toISOString();
      this.logs.unshift({
        id: `log_${Date.now()}_${i}`,
        timestamp,
        method: ep.method,
        path: ep.path,
        status: ep.status,
        durationMs: ep.dur + Math.floor(Math.random() * 15),
        ip: '127.0.0.1',
        userAgent: 'REST-Client/2.0 (Dashboard-Web)',
        authMethod: i % 2 === 0 ? 'bearer' : 'api-key',
        caller: i % 2 === 0 ? 'admin@company.io' : 'sk_live_prod...',
        severity: ep.sev
      });
      this.requestCount++;
      this.totalLatencyMs += ep.dur;
      if (ep.status >= 400) this.errorCount++;
    }
  }

  addLog(log: Omit<ApiLog, 'id' | 'timestamp'>) {
    const entry: ApiLog = {
      ...log,
      id: 'log_' + crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    this.logs.unshift(entry);
    if (this.logs.length > 500) {
      this.logs.pop();
    }
    this.requestCount++;
    this.totalLatencyMs += log.durationMs;
    if (log.status >= 400) {
      this.errorCount++;
    }
    return entry;
  }
}

export const store = new Store();
