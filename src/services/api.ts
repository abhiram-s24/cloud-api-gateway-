import { User, Project, ApiKey, ApiLog, AnalyticsData } from '../types';

const TOKEN_KEY = 'api_dashboard_token';
const USER_KEY = 'api_dashboard_user';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization'] && !headers['authorization'] && !headers['x-api-key']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP error ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  auth: {
    async getDemoUsers(): Promise<{ success: boolean; data: User[] }> {
      return request('/api/auth/demo-users');
    },
    async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
      const res = await request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },
    async register(name: string, email: string, password: string, role: string): Promise<{ success: boolean; token: string; user: User }> {
      const res = await request<{ success: boolean; token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },
    async me(): Promise<{ success: boolean; user?: User; apiKey?: any }> {
      return request('/api/auth/me');
    },
    async logout(): Promise<void> {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } finally {
        authStorage.clear();
      }
    }
  },

  projects: {
    async list(params?: { status?: string; environment?: string; search?: string }): Promise<{ success: boolean; count: number; data: Project[] }> {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.environment) query.set('environment', params.environment);
      if (params?.search) query.set('search', params.search);
      return request(`/api/projects?${query.toString()}`);
    },
    async get(id: string): Promise<{ success: boolean; data: Project }> {
      return request(`/api/projects/${id}`);
    },
    async create(payload: Partial<Project>): Promise<{ success: boolean; message: string; data: Project }> {
      return request('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    async update(id: string, payload: Partial<Project>): Promise<{ success: boolean; message: string; data: Project }> {
      return request(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },
    async toggleStatus(id: string, status: 'active' | 'maintenance' | 'deprecated'): Promise<{ success: boolean; data: Project }> {
      return request(`/api/projects/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return request(`/api/projects/${id}`, {
        method: 'DELETE'
      });
    }
  },

  keys: {
    async list(): Promise<{ success: boolean; count: number; data: ApiKey[] }> {
      return request('/api/keys');
    },
    async create(payload: { name: string; scopes: string[]; environment: string; rateLimit: number }): Promise<{ success: boolean; message: string; data: ApiKey }> {
      return request('/api/keys', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    async revoke(id: string): Promise<{ success: boolean; message: string; data: ApiKey }> {
      return request(`/api/keys/${id}/revoke`, {
        method: 'PATCH'
      });
    },
    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return request(`/api/keys/${id}`, {
        method: 'DELETE'
      });
    }
  },

  analytics: {
    async getOverview(): Promise<{ success: boolean; data: AnalyticsData }> {
      return request('/api/analytics/overview');
    },
    async getHealth(): Promise<{ status: string; uptimeSeconds: number; service: string }> {
      return request('/api/health');
    }
  },

  logs: {
    async list(params?: { severity?: string; search?: string; limit?: number }): Promise<{ success: boolean; count: number; data: ApiLog[] }> {
      const query = new URLSearchParams();
      if (params?.severity) query.set('severity', params.severity);
      if (params?.search) query.set('search', params.search);
      if (params?.limit) query.set('limit', params.limit.toString());
      return request(`/api/logs?${query.toString()}`);
    },
    async clear(): Promise<{ success: boolean; message: string }> {
      return request('/api/logs', { method: 'DELETE' });
    },
    async simulate(): Promise<{ success: boolean; data: ApiLog }> {
      return request('/api/logs/simulate', { method: 'POST' });
    }
  }
};
