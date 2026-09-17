import { useState } from 'react';
import { BookOpen, KeyRound, Shield, Terminal, Copy, Check, ExternalLink, Code2, Download, FileText, Gauge, Layers } from 'lucide-react';

export function DocsView() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/projects',
      desc: 'List all microservices with filtering by environment, status, and search keyword.',
      auth: 'Optional / Public',
      params: '?environment=production&status=active&search=checkout'
    },
    {
      method: 'POST',
      path: '/api/projects',
      desc: 'Register a new microservice with SLA tier and slug routing configuration.',
      auth: 'Bearer Token or API Key with [write] scope',
      body: '{\n  "name": "Audit Dispatcher",\n  "slug": "audit-v1",\n  "environment": "production",\n  "rateLimitTier": "enterprise"\n}'
    },
    {
      method: 'PUT',
      path: '/api/projects/:id',
      desc: 'Update existing microservice metadata, environment, or rate limit tiers.',
      auth: 'Bearer Token or API Key with [write] scope',
      body: '{\n  "name": "Audit Dispatcher (Updated)",\n  "status": "maintenance"\n}'
    },
    {
      method: 'DELETE',
      path: '/api/projects/:id',
      desc: 'Permanently remove a microservice and release slug routing reservations.',
      auth: 'Admin Token or API Key with [admin] scope',
      params: 'None'
    },
    {
      method: 'GET',
      path: '/api/keys',
      desc: 'Retrieve list of all issued API keys and authorization scopes (masked secrets).',
      auth: 'Admin or Developer Session Token',
      params: 'None'
    },
    {
      method: 'POST',
      path: '/api/keys',
      desc: 'Generate a new cryptographically secured SHA-256 API key with customized scopes.',
      auth: 'Admin role required',
      body: '{\n  "name": "CI/CD Deployment Key",\n  "scopes": ["read", "write"],\n  "environment": "production",\n  "rateLimit": 300\n}'
    },
    {
      method: 'GET',
      path: '/api/analytics/overview',
      desc: 'Real-time telemetry, latency percentiles, error rate, and Node.js runtime stats.',
      auth: 'Public / Unrestricted',
      params: 'None'
    },
    {
      method: 'GET',
      path: '/api/health',
      desc: 'Standard lightweight health check endpoint for container probes and load balancers.',
      auth: 'Public / Unrestricted',
      params: 'None'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            RESTful API Documentation & Reference
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Complete endpoint definitions, authentication schemes, and ready-to-use SDK code snippets.
          </p>
        </div>

        {/* OpenAPI & Postman Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/openapi.json"
            download="openapi.json"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>OpenAPI 3.0 Spec</span>
            <Download className="h-3 w-3 text-zinc-400" />
          </a>

          <a
            href="/postman_collection.json"
            download="postman_collection.json"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-amber-600" />
            <span>Postman Collection</span>
            <Download className="h-3 w-3 text-zinc-400" />
          </a>
        </div>
      </div>

      {/* Rate Limiting & SLA Tiers */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-amber-600" />
          <span>Sliding-Window Rate Limiting & HTTP 429 Quotas</span>
        </h2>
        <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
          The API Gateway implements active in-memory sliding-window rate limiting. Every API response includes RFC-standard rate limit tracking headers:
        </p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="font-mono text-xs font-bold text-zinc-900">X-RateLimit-Limit</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">Maximum allowed calls in a 60-second window based on API key tier.</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="font-mono text-xs font-bold text-zinc-900">X-RateLimit-Remaining</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">Number of requests remaining before receiving an HTTP 429 backoff error.</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="font-mono text-xs font-bold text-zinc-900">X-RateLimit-Reset</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">Seconds remaining until the sliding counter resets back to full quota.</div>
          </div>
        </div>
      </div>

      {/* Authentication Scheme Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span>Security & Authentication Headers</span>
        </h2>
        <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
          The RESTful API supports two secure authentication mechanisms:
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="text-xs font-semibold text-zinc-800">Method 1: API Key Header</div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Ideal for backend servers, cron jobs, and third-party webhooks.
            </div>
            <pre className="mt-2 rounded bg-zinc-900 p-2 font-mono text-[11px] text-emerald-400">
              x-api-key: sk_live_9f82...3021
            </pre>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="text-xs font-semibold text-zinc-800">Method 2: Bearer JWT / Session</div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Standard OAuth2 / Session header used by frontend dashboards.
            </div>
            <pre className="mt-2 rounded bg-zinc-900 p-2 font-mono text-[11px] text-blue-400">
              Authorization: Bearer tok_7d82...9192
            </pre>
          </div>
        </div>
      </div>

      {/* Endpoints Table / Catalog */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Available RESTful Endpoints
          </h2>
        </div>

        <div className="divide-y divide-zinc-200">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="p-5 hover:bg-zinc-50/50 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      ep.method === 'GET'
                        ? 'bg-blue-50 text-blue-700'
                        : ep.method === 'POST'
                        ? 'bg-emerald-50 text-emerald-700'
                        : ep.method === 'PUT'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-sm font-bold text-zinc-900">{ep.path}</span>
                </div>

                <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                  Auth: {ep.auth}
                </span>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">{ep.desc}</p>

              {ep.body && (
                <div className="mt-2">
                  <div className="text-[11px] font-semibold text-zinc-500 mb-1">Payload:</div>
                  <pre className="rounded bg-zinc-900 p-2.5 font-mono text-[11px] text-zinc-200 overflow-x-auto">
                    {ep.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Code SDK Integration Examples */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-zinc-700" />
          <span>Quickstart Code Snippets</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs text-zinc-400">
              <span className="font-mono font-semibold text-zinc-200">cURL Integration</span>
              <button
                onClick={() =>
                  handleCopy(
                    `curl -X GET "${window.location.origin}/api/projects" \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json"`,
                    'curl-doc'
                  )
                }
                className="text-zinc-400 hover:text-white"
              >
                {copiedSection === 'curl-doc' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <pre className="mt-3 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
{`curl -X GET "${window.location.origin}/api/projects" \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs text-zinc-400">
              <span className="font-mono font-semibold text-zinc-200">Node.js / TypeScript (Fetch)</span>
              <button
                onClick={() =>
                  handleCopy(
                    `const res = await fetch("${window.location.origin}/api/projects", {\n  headers: {\n    "x-api-key": process.env.API_KEY,\n    "Content-Type": "application/json"\n  }\n});\nconst { data } = await res.json();`,
                    'node-doc'
                  )
                }
                className="text-zinc-400 hover:text-white"
              >
                {copiedSection === 'node-doc' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <pre className="mt-3 font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre leading-relaxed">
{`const res = await fetch("${window.location.origin}/api/projects", {
  headers: {
    "x-api-key": process.env.API_KEY,
    "Content-Type": "application/json"
  }
});
const { data } = await res.json();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
