---
name: security-check
description: "Security audit covering exposed secrets, leaked implementation details, hardcoded credentials, .env handling, client-side data exposure, CORS/CSP, input validation, injection vectors, and dependency vulnerabilities. Use when someone says: is it secure, security check, doesn't expose anything, check for leaks."
---

# Security Check

Focused security audit with PASS/FAIL per check and exact file:line references for any failures.

## Checks

Run ALL of the following checks. Report PASS or FAIL for each one.

### 1. No Exposed API Keys, Tokens, or Secrets
- Search all tracked files for patterns: API keys, bearer tokens, JWT secrets, database connection strings, AWS credentials, Stripe keys, Supabase keys, OpenAI/Anthropic keys
- Common patterns to search: `sk-`, `pk_`, `AKIA`, `ghp_`, `Bearer `, `password`, `secret`, `token`, API key formats
- Check git history for previously committed secrets (search recent commits)
- **FAIL** if any secret is found in tracked files. Report exact file:line.

### 2. No Implementation Details in Error Messages
- Check error responses returned to clients for stack traces, file paths, database schema details, internal IPs, or technology stack information
- Check that production error handlers don't leak internals
- **FAIL** if error messages expose implementation details.

### 3. No Hardcoded Credentials
- Search for hardcoded usernames, passwords, connection strings, or API endpoints with embedded credentials
- Check for default credentials left in code
- Check for test credentials that work in production
- **FAIL** if any hardcoded credential is found.

### 4. Environment Files in .gitignore
- Verify `.env`, `.env.local`, `.env.production`, `.env.development` are in .gitignore
- Check that no .env files are tracked by git
- Check for .env.example that might contain real values instead of placeholders
- **FAIL** if any .env file is tracked or .gitignore is missing entries.

### 5. No Sensitive Data in Client-Side Code
- For web apps: check that API keys, database credentials, and admin endpoints are not in client-side bundles
- Check Next.js: only `NEXT_PUBLIC_` prefixed vars should be in client code
- Check for sensitive data in localStorage, sessionStorage, or cookies without secure/httpOnly flags
- **FAIL** if sensitive data is accessible client-side.

### 6. CORS and CSP Headers
- Check CORS configuration: is it overly permissive (Access-Control-Allow-Origin: *)?
- Check for Content-Security-Policy headers
- Check for X-Frame-Options, X-Content-Type-Options, X-XSS-Protection headers
- **FAIL** if CORS allows all origins in production or CSP is missing.

### 7. Input Validation on All Endpoints
- Check API routes for input validation (zod, joi, yup, or manual validation)
- Check for unvalidated query parameters, body fields, or URL parameters
- Check file upload handling for type/size validation
- **FAIL** if any endpoint accepts unvalidated input.

### 8. No SQL Injection or XSS Vectors
- Check for raw SQL queries with string interpolation
- Check for unsafe raw HTML rendering without sanitization
- Check for dynamic code execution with user input
- Check for URL-based XSS (user input in href, src, or event handlers)
- **FAIL** if any injection vector is found.

### 9. Dependency Vulnerabilities
- Run `npm audit` (or equivalent for the package manager in use)
- Report any high or critical vulnerabilities
- Check for outdated dependencies with known CVEs
- **FAIL** if any high/critical vulnerability exists.

## Output Format

```
## Security Audit Report

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Exposed secrets | PASS | No secrets found in 47 files scanned |
| 2 | Error message leaks | FAIL | src/api/handler.ts:23 — stack trace in 500 response |
| 3 | Hardcoded credentials | PASS | — |
| 4 | .env in .gitignore | PASS | All env files properly excluded |
| 5 | Client-side secrets | FAIL | lib/config.ts:5 — SUPABASE_SERVICE_KEY in client bundle |
| 6 | CORS/CSP headers | PASS | CORS restricted to app domain |
| 7 | Input validation | FAIL | api/users/route.ts:12 — no body validation |
| 8 | Injection vectors | PASS | Using parameterized queries throughout |
| 9 | Dependencies | PASS | 0 high/critical vulnerabilities |

## Overall: FAIL (2 critical, 1 high)

### Critical Issues (fix immediately)
1. **[file:line]** — [Description] — [How to fix]
2. **[file:line]** — [Description] — [How to fix]

### High Issues
1. **[file:line]** — [Description] — [How to fix]

### Recommendations
- [Optional improvements that aren't failures but would strengthen security]
```

## Rules

- Every FAIL must include an exact file path and line number.
- Do not mark something as PASS if you couldn't fully verify it. Use "UNABLE TO VERIFY" with an explanation.
- If the project has no API endpoints, mark endpoint-related checks as "N/A" not "PASS".
- After the report, offer to fix all critical and high issues immediately.
- For secrets found in git history, recommend using `git filter-repo` or BFG Repo Cleaner and rotating the compromised credentials.
- Run `npm audit` as an actual command, not a guess. Report the real output.
- If the project uses Supabase, check that the service_role key is never in client-side code (only anon key should be public).
