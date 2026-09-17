import { useState, useEffect } from 'react';
import { Send, Play, Copy, Check, Terminal, Code, Clock, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { ApiKey, User } from '../types';
import { authStorage } from '../services/api';

interface PlaygroundViewProps {
  apiKeys: ApiKey[];
  currentUser: User | null;
  initialEndpoint?: string;
}

export function PlaygroundView({ apiKeys, currentUser, initialEndpoint }: PlaygroundViewProps) {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [endpoint, setEndpoint] = useState<string>(initialEndpoint || '/api/projects');
  const [authMode, setAuthMode] = useState<'session' | 'key' | 'none'>('session');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('{\n  "name": "Audit Dispatcher",\n  "description": "Real-time compliance log processor",\n  "environment": "staging",\n  "rateLimitTier": "standard"\n}');
  const [customHeader, setCustomHeader] = useState<string>('');

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'response' | 'curl' | 'javascript'>('response');

  useEffect(() => {
    if (initialEndpoint) {
      setEndpoint(initialEndpoint);
    }
  }, [initialEndpoint]);

  // Set default API key if available
  useEffect(() => {
    const activeKey = apiKeys.find((k) => k.status === 'active');
    if (activeKey) {
      // If we don't have the raw key, use prefix or sample test key
      setSelectedKey(activeKey.fullKey || activeKey.keyPrefix);
    }
  }, [apiKeys]);

  const presetEndpoints = [
    { label: 'List Microservices (GET)', method: 'GET' as const, path: '/api/projects' },
    { label: 'Create Microservice (POST)', method: 'POST' as const, path: '/api/projects' },
    { label: 'Analytics Overview (GET)', method: 'GET' as const, path: '/api/analytics/overview' },
    { label: 'Echo Test & Context (ALL)', method: 'POST' as const, path: '/api/test/echo' },
    { label: 'Secure Protected Vault (GET)', method: 'GET' as const, path: '/api/test/secure-data' },
    { label: 'API Keys Registry (GET)', method: 'GET' as const, path: '/api/keys' },
    { label: 'Health Status Ping (GET)', method: 'GET' as const, path: '/api/health' }
  ];

  const handleSelectPreset = (preset: typeof presetEndpoints[0]) => {
    setMethod(preset.method);
    setEndpoint(preset.path);
    if (preset.method === 'POST' && preset.path === '/api/projects') {
      setRequestBody('{\n  "name": "Audit Dispatcher",\n  "description": "Real-time compliance log processor",\n  "environment": "staging",\n  "rateLimitTier": "standard"\n}');
    } else if (preset.path === '/api/test/echo') {
      setRequestBody('{\n  "message": "Testing REST API Gateway",\n  "traceId": "tr_9941"\n}');
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    const start = performance.now();
    setResponseStatus(null);
    setResponseData(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (authMode === 'session') {
      const token = authStorage.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (authMode === 'key') {
      if (selectedKey) {
        headers['x-api-key'] = selectedKey;
      }
    }

    if (customHeader) {
      const [k, v] = customHeader.split(':');
      if (k && v) headers[k.trim()] = v.trim();
    }

    try {
      const options: RequestInit = {
        method,
        headers
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
        try {
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch {
          setResponseStatus(400);
          setResponseData({ error: 'Client JSON Parse Error', message: 'Malformed JSON payload in request body' });
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(endpoint, options);
      const duration = Math.round(performance.now() - start);

      const resHeadersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeadersObj[key] = val;
      });

      const json = await res.json().catch(() => ({ raw: 'Non-JSON response received' }));

      setResponseStatus(res.status);
      setResponseTimeMs(duration);
      setResponseData(json);
      setResponseHeaders(resHeadersObj);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseTimeMs(Math.round(performance.now() - start));
      setResponseData({ error: 'Network / Connection Error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCurl = () => {
    let authHeader = '';
    if (authMode === 'session') {
      const token = authStorage.getToken() || 'YOUR_SESSION_TOKEN';
      authHeader = ` \\\n  -H "Authorization: Bearer ${token}"`;
    } else if (authMode === 'key') {
      authHeader = ` \\\n  -H "x-api-key: ${selectedKey || 'YOUR_API_KEY'}"`;
    }

    let dataFlag = '';
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      dataFlag = ` \\\n  -d '${requestBody.replace(/'/g, "\\'")}'`;
    }

    return `curl -X ${method} "${window.location.origin}${endpoint}" \\
  -H "Content-Type: application/json"${authHeader}${dataFlag}`;
  };

  const generateJsFetch = () => {
    let authHeader = '';
    if (authMode === 'session') {
      authHeader = `\n    "Authorization": "Bearer ${authStorage.getToken() || 'YOUR_SESSION_TOKEN'}",`;
    } else if (authMode === 'key') {
      authHeader = `\n    "x-api-key": "${selectedKey || 'YOUR_API_KEY'}",`;
    }

    let bodyOption = '';
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      bodyOption = `,\n  body: JSON.stringify(${requestBody.trim()})`;
    }

    return `const response = await fetch("${endpoint}", {
  method: "${method}",
  headers: {
    "Content-Type": "application/json",${authHeader}
  }${bodyOption}
});

const data = await response.json();
console.log(data);`;
  };

  const handleCopyCode = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          REST API Playground
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Interactive developer console to test endpoints, craft payloads, inspect status codes and headers.
        </p>
      </div>

      {/* Preset Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-1">
          Presets:
        </span>
        {presetEndpoints.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Request Composer */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        {/* Method & URL Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id="select-http-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:border-zinc-900 focus:outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs font-mono text-zinc-400">
              {window.location.origin}
            </span>
            <input
              id="input-endpoint-url"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 pl-48 pr-3 py-2 text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
              placeholder="/api/projects"
            />
          </div>

          <button
            id="btn-send-request"
            onClick={handleExecute}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Send Request</span>
              </>
            )}
          </button>
        </div>

        {/* Authentication Mode Toggle */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-700">Authentication:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="auth_mode"
                checked={authMode === 'session'}
                onChange={() => setAuthMode('session')}
                className="text-zinc-900 focus:ring-0"
              />
              <span>Session Bearer</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="auth_mode"
                checked={authMode === 'key'}
                onChange={() => setAuthMode('key')}
                className="text-zinc-900 focus:ring-0"
              />
              <span>x-api-key</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="auth_mode"
                checked={authMode === 'none'}
                onChange={() => setAuthMode('none')}
                className="text-zinc-900 focus:ring-0"
              />
              <span className="text-zinc-500">None (Test 401)</span>
            </label>
          </div>

          {authMode === 'key' && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Key:</span>
              <input
                type="text"
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                placeholder="sk_live_..."
                className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-mono w-48 text-zinc-800"
              />
            </div>
          )}
        </div>

        {/* Request Body Editor (for POST/PUT/PATCH) */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-700">Request Body (JSON)</span>
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(requestBody);
                    setRequestBody(JSON.stringify(parsed, null, 2));
                  } catch {}
                }}
                className="text-emerald-600 hover:underline text-[11px]"
              >
                Format JSON
              </button>
            </div>
            <textarea
              id="textarea-request-body"
              rows={4}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-900 p-3 font-mono text-xs text-zinc-100 focus:border-zinc-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Response & Code Snippets Tabs */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCodeTab('response')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                codeTab === 'response'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Response Payload
            </button>
            <button
              onClick={() => setCodeTab('curl')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                codeTab === 'curl'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              cURL Command
            </button>
            <button
              onClick={() => setCodeTab('javascript')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                codeTab === 'javascript'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              JavaScript (fetch)
            </button>
          </div>

          {/* Response Meta badges */}
          {responseStatus !== null && codeTab === 'response' && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  responseStatus >= 200 && responseStatus < 300
                    ? 'bg-emerald-100 text-emerald-800'
                    : responseStatus >= 400
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-zinc-200 text-zinc-800'
                }`}
              >
                HTTP {responseStatus}
              </span>
              <span className="text-zinc-500 font-mono">
                {responseTimeMs}ms
              </span>
            </div>
          )}
        </div>

        {/* Tab contents */}
        <div className="p-4 bg-zinc-950 text-zinc-100 min-h-60 relative">
          {codeTab === 'response' && (
            <div>
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => handleCopyCode(JSON.stringify(responseData, null, 2), 'response')}
                  className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                >
                  {copiedCode === 'response' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCode === 'response' ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed">
                {responseData
                  ? JSON.stringify(responseData, null, 2)
                  : '// Click "Send Request" to execute API call and inspect the live response.'}
              </pre>
            </div>
          )}

          {codeTab === 'curl' && (
            <div>
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => handleCopyCode(generateCurl(), 'curl')}
                  className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                >
                  {copiedCode === 'curl' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCode === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {generateCurl()}
              </pre>
            </div>
          )}

          {codeTab === 'javascript' && (
            <div>
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => handleCopyCode(generateJsFetch(), 'js')}
                  className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                >
                  {copiedCode === 'js' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCode === 'js' ? 'Copied!' : 'Copy JS'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre leading-relaxed">
                {generateJsFetch()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
