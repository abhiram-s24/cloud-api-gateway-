# 🌐 Cloud REST API Gateway & Microservices Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0_Spec-6BA539?style=flat&logo=openapiinitiative&logoColor=white)](https://www.openapis.org/)
[![Security](https://img.shields.io/badge/Security-SHA--256_RBAC-success?style=flat)](#security--cryptographic-model)

A production-grade, full-stack **REST API Gateway and Microservices Management Platform**. Engineered with an asynchronous Node.js/Express backend and an interactive React dashboard, this platform enables developers to register microservice routes, issue and manage cryptographically secured API keys with fine-grained RBAC scopes, enforce sliding-window rate limits, and inspect real-time telemetry metrics and request audit trails.

---

## 🏗️ System Architecture

```text
                                  +---------------------------------------+
                                  |         Client Dashboard / API Caller |
                                  |       (cURL, Postman, Frontend SPA)   |
                                  +-------------------+-------------------+
                                                      |
                                                      | HTTP / HTTPS (Port 3000)
                                                      v
                                  +---------------------------------------+
                                  |         Express.js Gateway Core       |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
          +-----------------------------+                           +-----------------------------+
          |   Authentication Engine     |                           |    Sliding-Window Limiter   |
          |  - SHA-256 API Key Hash     |                           |  - Per-key / IP Quotas      |
          |  - Bearer Session Validation|                           |  - RFC X-RateLimit Headers  |
          |  - RBAC Scope Enforcement   |                           |  - HTTP 429 Retry-After     |
          +--------------+--------------+                           +--------------+--------------+
                         |                                                         |
                         +----------------------------+----------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         RESTful Microservice API      |
                                  |   /projects, /keys, /analytics, /logs |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |     Real-Time Telemetry & Audit Log   |
                                  |   (Latency, p95/p99, Status Meters)   |
                                  +---------------------------------------+
```

---

## ✨ Core Engineering Highlights

- **Cryptographically Hashed API Key Management**:
  - Issues revocable API keys prefixed with `sk_live_` or `sk_test_`.
  - Keys are salted and hashed using **SHA-256** prior to storage; plain-text tokens are revealed only once upon creation and cannot be retrieved afterwards.
- **Fine-Grained Role-Based Access Control (RBAC)**:
  - Declarative scope verification (`read`, `write`, `admin`) protecting sensitive mutation endpoints.
  - Multi-scheme authentication accepting both `x-api-key` headers and `Authorization: Bearer <token>` session tokens.
- **Sliding-Window Rate Limiting**:
  - In-memory rate limiting engine enforcing SLA quotas (Basic: 60 req/min, Standard: 300 req/min, Enterprise: 1200 req/min).
  - Emits standard RFC headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`, returning `HTTP 429 Too Many Requests` when limits are exceeded.
- **Microservices Resource Registry**:
  - Full CRUD lifecycle management for registered API routes, SLA tiers, and deployment environments (`production`, `staging`, `development`).
- **Interactive REST API Playground**:
  - Live in-browser HTTP client to craft authenticated `GET`, `POST`, `PUT`, `DELETE` requests directly to backend endpoints with real status codes, response headers, and auto-generated `cURL` and `fetch` snippets.
- **Observability & Audit Stream**:
  - Interceptor middleware profiling latency percentiles, error rates, and chronological request logs with client IP and identity tracking.
- **OpenAPI 3.0 & Postman Ready**:
  - Built-in `openapi.json` specification and `postman_collection.json` available for 1-click download directly from the documentation portal.

---

## 📋 RESTful API Endpoint Reference

| Method | Endpoint | Auth Required | Minimum Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | None | Health check probe for orchestrators & reverse proxies |
| `GET` | `/api/projects` | Public / Optional | None | List registered microservices with environment/search filters |
| `POST` | `/api/projects` | Yes | `write` | Register a new microservice with SLA tier and route slug |
| `PUT` | `/api/projects/:id` | Yes | `write` | Update microservice metadata, SLA tier, or status |
| `DELETE` | `/api/projects/:id` | Yes | `admin` | Permanently deregister a microservice route |
| `GET` | `/api/keys` | Yes | `read` | List issued API keys (masked tokens and RBAC scopes) |
| `POST` | `/api/keys` | Yes | `admin` | Generate a new SHA-256 API key with customized scopes |
| `DELETE` | `/api/keys/:id` | Yes | `admin` | Instantly revoke an active API key |
| `GET` | `/api/analytics/overview` | Public | None | Real-time gateway telemetry, latency, and status code distribution |
| `GET` | `/api/logs` | Yes | `read` | Retrieve chronological request audit log stream |
| `POST` | `/api/test/echo` | Optional | None | Echo request payload, headers, and authentication context |

---

## 🔒 Security & Cryptographic Model

### 1. Key Storage Architecture
Raw API keys are generated using cryptographically random byte sequences:
```typescript
const secretToken = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
```
Upon generation, the server computes:
```typescript
const hashedKey = crypto.createHash('sha256').update(secretToken).digest('hex');
```
Only `hashedKey` and a public prefix (e.g. `sk_live_9f82...`) are retained in storage. Even in the event of an unauthorized database dump, plain-text API keys cannot be compromised.

### 2. Header Formats
API consumers can authenticate using either:
```http
x-api-key: sk_live_9f829a8f27b4012ce4e8...
```
or standard OAuth2 / session Bearer tokens:
```http
Authorization: Bearer tok_admin_demo_session
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   cd <YOUR_REPO_NAME>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application boots on `http://localhost:3000` with both the Express API and Vite React frontend concurrently mounted.

4. **Build for Production**:
   ```bash
   npm run build
   ```
   Compiles the frontend assets to `dist/` and bundles the Express server to `dist/server.cjs` via `esbuild`.

5. **Start Production Server**:
   ```bash
   npm start
   ```

---

## 📂 Project Structure

```text
├── server/
│   ├── middleware/
│   │   ├── auth.ts          # Bearer & x-api-key RBAC authentication
│   │   ├── logger.ts        # Request duration & audit trail interceptor
│   │   └── ratelimit.ts     # Sliding-window rate limiter (RFC headers)
│   ├── routes/
│   │   ├── analytics.ts     # Telemetry & performance metrics
│   │   ├── auth.ts          # Session management & user credentials
│   │   ├── keys.ts          # Cryptographic key issuance & revocation
│   │   ├── logs.ts          # Request audit log querying
│   │   ├── projects.ts      # Microservices CRUD operations
│   │   └── test.ts          # Universal echo & payload validation
│   └── store.ts             # In-memory storage engine & SHA-256 hashing
├── src/
│   ├── components/
│   │   ├── ApiKeysView.tsx  # API key generation & RBAC scope manager
│   │   ├── DocsView.tsx     # OpenAPI / Postman & API reference
│   │   ├── LogsView.tsx     # Chronological request inspector
│   │   ├── OverviewView.tsx # High-level telemetry & latency metrics
│   │   ├── PlaygroundView.tsx# Interactive REST HTTP client
│   │   └── ProjectsView.tsx # Microservices registry & CRUD
│   ├── services/
│   │   └── api.ts           # Centralized client HTTP SDK
│   ├── types.ts             # Global TypeScript interfaces & types
│   ├── App.tsx              # Root application router & layout
│   └── main.tsx             # React DOM entry point
├── public/
│   ├── openapi.json         # Complete OpenAPI 3.0 specification
│   └── postman_collection.json # Exportable Postman collection
├── server.ts                # Unified Express entry point & Vite middleware
└── package.json
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
