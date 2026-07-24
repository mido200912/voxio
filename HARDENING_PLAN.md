# Architecture Hardening Plan - 30 Resilience Controls

This plan outlines the systematic evaluation and secure refactoring of the `voxio` workspace to implement the 30 Architectural Resilience Controls.

## Proposed Changes

### Core Server & Gateway (backend/server.js)
- **Control 1 (Request Sync):** Strip ambiguous headers (`Content-Length`/`Transfer-Encoding`).
- **Control 5 (Cache Isolation):** Add global middleware to enforce `Cache-Control: private, no-store` on authenticated routes.
- **Control 10 (Domain Boundaries):** Validate `Host` headers strictly against `allowedOrigins`.
- **Control 28 (Resource Limits):** Lower `express.json` limits for non-file routes and set strict timeout bounds.
- **Control 25 (Protocol Handling):** Enforce strict URI schemes in cors/origin validations.

### Container & Pipeline (backend/Dockerfile & package.json)
- **Control 12 (Dependency Integrity):** Switch to `npm ci` in Dockerfile.
- **Control 15 (Container Isolation):** Add `USER node` (or 10001) to drop root privileges in Dockerfile.
- **Control 23 (Memory Safety):** Enforce V8 memory limits (`--max-old-space-size`) in Node execution script.
- **Control 26 (Kernel Restraints):** Drop capabilities via Docker/Podman run configurations (documented for deployment).

### Authentication & Identity (backend/middleware/auth.js & controllers)
- **Control 7 (Token Integrity):** Hardcode `algorithms: ['HS256']` (or RS256) in `jwt.verify`.
- **Control 16 (Access Control Defaults):** Enforce explicit authentication middlewares globally where possible.
- **Control 19 (Identity Verification):** Enforce `email_verified: true` check in Google/OAuth sign-in controllers.
- **Control 20 (Constant-Time Operations):** Replace direct string comparisons of hashes/tokens with `crypto.timingSafeEqual`.

### Data Validation & State (backend/controllers & models)
- **Control 3 (Strict Serialization):** Replace raw object deserialization with strict parsing.
- **Control 4 (Mutability Protection):** Block prototype overrides, use `Object.create(null)` for temporary data maps.
- **Control 17 (State Transaction):** Convert balance/state mutations to MongoDB atomic operations (e.g., `$inc` with conditions).
- **Control 18 (DTO Enforcement):** Implement Zod schemas for all critical POST/PUT payloads to whitelist fields.

### Outbound Network & Integrations (backend/services)
- **Control 11 (Outbound Isolation):** Implement Axios interceptor to block SSRF (RFC 1918 IPs and `169.254.169.254`).
- **Control 21 (AI Prompt Delimitation):** Isolate untrusted inputs in AI integrations using explicit boundaries (e.g., XML tags or separate user/system roles).

### Frontend Safety (frontend/src)
- **Control 2 (Safe Templating):** Audit and remove `dangerouslySetInnerHTML` unless wrapped with DOMPurify.
- **Control 6 (DOM Safety):** Enforce strict DOM sanitizers on all client-rendered markdown or HTML from backend.
- **Control 30 (Output Encoding):** Contextually encode all user-supplied data in dashboards.

### Media & Logs (backend)
- **Control 22 (Data Anonymization):** Add masking for PII (emails, tokens, passwords) in Winston/Morgan logs.
- **Control 27 (Media Sandboxing):** Strictly validate mime types and isolate file processing using `multer` limits.
