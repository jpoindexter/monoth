---
name: gap-analysis
description: "Two-phase workflow: Phase 1 finds all gaps across features, security, performance, docs, tests, deployment, monitoring, error handling, edge cases, accessibility, SEO, and competitive positioning. Phase 2 fixes all P0 and P1 gaps immediately. Use when someone says: gap analysis, what's missing, find the gaps, what am I missing."
---

# Gap Analysis

Ruthless two-phase gap analysis. Phase 1: find everything that's missing. Phase 2: fix the critical stuff immediately.

## Phase 1: Find All Gaps

Scan the entire project (or specified scope) across every dimension below. For each gap found, assign a severity:

- **P0 (Critical)**: Will cause failures, security breaches, data loss, or blocks launch. Fix NOW.
- **P1 (High)**: Significant quality or trust issue. Fix before shipping.
- **P2 (Medium)**: Should be fixed but won't block launch. Fix this week.
- **P3 (Low)**: Nice to have. Fix when convenient.

### Dimensions to Check

1. **Features**: Missing functionality that users would expect. Table-stakes features that competitors have. Incomplete implementations (half-built features are worse than missing features).

2. **Security**: Authentication gaps, authorization bypass, exposed secrets, missing rate limiting, unvalidated input, missing HTTPS enforcement, insecure defaults, missing CSP headers, CORS misconfiguration.

3. **Performance**: Missing caching, unoptimized queries, missing pagination, large bundle sizes, render-blocking resources, missing lazy loading, synchronous operations that should be async, missing CDN usage.

4. **Documentation**: Missing README, missing API docs, missing setup instructions, missing environment variable documentation, missing architecture decisions, missing contribution guide, outdated docs.

5. **Tests**: Missing unit tests, missing integration tests, missing E2E tests, untested edge cases, untested error paths, missing test for critical business logic, low coverage on important modules.

6. **Deployment**: Missing CI/CD, missing health checks, missing rollback plan, missing environment separation (dev/staging/prod), missing deployment documentation, missing database migration strategy.

7. **Monitoring**: Missing error tracking (Sentry etc.), missing uptime monitoring, missing performance monitoring, missing alerting, missing logging, missing audit trail for sensitive operations.

8. **Error Handling**: Unhandled promise rejections, missing try/catch, generic error messages, missing error boundaries, missing retry logic, missing graceful degradation, missing offline handling.

9. **Edge Cases**: Empty states, zero results, single item vs plural, very long text, special characters, concurrent edits, timezone handling, pagination boundaries, rate limit handling.

10. **Accessibility**: Missing ARIA attributes, missing keyboard navigation, missing screen reader support, insufficient color contrast, missing focus management, missing skip links, missing alt text.

11. **SEO**: Missing meta tags, missing OG tags, missing structured data, missing sitemap, missing robots.txt, non-semantic HTML, missing canonical URLs, missing heading hierarchy.

12. **Competitive Positioning**: Features that competitors have that this product doesn't. Differentiators that aren't highlighted. Missing social proof, missing trust signals, missing pricing transparency.

## Phase 1 Output

```
## Gap Analysis Report

### P0 — Critical (fix NOW)
1. [Dimension] [Description] — [file:line if applicable]
2. ...

### P1 — High (fix before shipping)
1. [Dimension] [Description] — [file:line if applicable]
2. ...

### P2 — Medium (fix this week)
1. [Dimension] [Description] — [file:line if applicable]
2. ...

### P3 — Low (fix when convenient)
1. [Dimension] [Description] — [file:line if applicable]
2. ...

### Summary
| Dimension | P0 | P1 | P2 | P3 | Total |
|-----------|----|----|----|----|-------|
| Features | 0 | 2 | 1 | 0 | 3 |
| Security | 1 | 0 | 0 | 0 | 1 |
| ... | | | | | |
| **Total** | **X** | **Y** | **Z** | **W** | **N** |
```

## Phase 2: Fix P0 and P1

After presenting the Phase 1 report:

1. **Ask for confirmation**: "Found X P0 and Y P1 issues. Fixing all of them now. Any you want to skip?"
2. **Fix all P0 issues first**, then all P1 issues.
3. **For each fix**: Show what was changed and why.
4. **Run build/typecheck** after all fixes to confirm nothing broke.
5. **Re-scan** the fixed dimensions to confirm the gaps are closed.

## Phase 2 Output

```
## Fixes Applied

### P0 Fixes
1. [file] — [What was fixed] — [Why it matters]
2. ...

### P1 Fixes
1. [file] — [What was fixed] — [Why it matters]
2. ...

### Verification
- Build: PASS / FAIL
- Types: PASS / FAIL
- Remaining P0: 0
- Remaining P1: 0

### P2/P3 Backlog (not fixed, for later)
1. [Description] — [Suggested approach]
2. ...
```

## Rules

- Be thorough in Phase 1. The whole point is to find EVERYTHING in one pass.
- Do not inflate severity. P0 means "will break in production" not "would be nice to have".
- In Phase 2, actually fix the issues. Don't just describe what to do.
- If a P0/P1 fix requires significant refactoring, explain the scope and ask before proceeding.
- Always run build verification after Phase 2 fixes.
- Present the P2/P3 backlog so the user can prioritize for later.
