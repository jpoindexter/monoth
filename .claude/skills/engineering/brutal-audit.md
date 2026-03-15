---
name: brutal-audit
description: "Multi-pass quality audit that rates code across 5 dimensions (security, performance, code quality, UX/DX, competitive analysis). Use when someone says: run judges, be brutal, audit this, is this production ready. Defaults to NEEDS WORK. No inflated scores."
---

# Brutal Audit

Run a 5-pass quality audit on the current codebase or specified files. Be honest. Default stance is "NEEDS WORK" — only give high marks when genuinely earned.

## Process

1. **Identify scope**: Ask what to audit if not obvious. Default to the entire project in the current working directory.

2. **Run all 5 passes sequentially**:

### Pass 1: Security
- Exposed secrets, API keys, tokens in code or git history
- Hardcoded credentials
- .env files not in .gitignore
- Client-side exposure of sensitive data
- Input validation on all endpoints
- SQL injection, XSS, CSRF vectors
- Dependency vulnerabilities (run `npm audit` if applicable)
- CORS/CSP configuration
- Authentication/authorization gaps

### Pass 2: Performance
- Bundle size analysis (check for unnecessary dependencies)
- Render-blocking resources
- N+1 queries or redundant API calls
- Missing caching (headers, memoization, static generation)
- Unoptimized images or assets
- Missing lazy loading
- Database query efficiency
- Memory leaks (event listeners, subscriptions not cleaned up)

### Pass 3: Code Quality
- Dead code (unused imports, unreachable branches, commented-out code)
- Code duplication (DRY violations)
- Naming clarity (variables, functions, files)
- Type safety (any types, missing types, loose assertions)
- Error handling coverage
- Consistent patterns and conventions
- Function length and complexity
- Missing or outdated comments

### Pass 4: UX/DX
- Loading states and error states
- Accessibility (ARIA, keyboard nav, color contrast, screen readers)
- Mobile responsiveness
- SEO basics (meta tags, structured data, semantic HTML)
- Developer onboarding (README, setup instructions, env examples)
- API documentation
- Meaningful error messages for end users
- Edge case handling (empty states, long text, special characters)

### Pass 5: Competitive Analysis
- How does this compare to existing solutions?
- What features are table-stakes that are missing?
- What is the unique differentiator?
- Would an enterprise buyer (YouTube, Google Health, FedEx scale) trust this?
- Is there anything that screams "side project" vs "production product"?

## Output Format

For each pass, output:

```
## Pass N: [Dimension] — Grade: [C+ to A]

### Issues Found
1. [CRITICAL] Description — file:line
2. [HIGH] Description — file:line
3. [MEDIUM] Description — file:line
4. [LOW] Description — file:line

### What's Actually Good
- Thing that genuinely works well
```

Then output a summary:

```
## Overall Verdict

| Dimension | Grade | Issues |
|-----------|-------|--------|
| Security | B- | 3 |
| Performance | C+ | 7 |
| Code Quality | B | 4 |
| UX/DX | C+ | 8 |
| Competitive | B- | 2 |

**Overall: [GRADE]**
**Production Ready: YES / NO / ALMOST**

## Critical Fixes (do these now)
1. ...
2. ...

## High Priority (do these this week)
1. ...
2. ...
```

## Rules

- Never give an A unless the code is genuinely exceptional in that dimension
- C+ is the default starting point. Earn your way up.
- Every issue must reference a specific file and line number when possible
- "It works" is not the same as "it's good"
- If the project has no tests, that is automatically a C+ ceiling on Code Quality
- If there are any exposed secrets, Security is an automatic F
- After presenting the audit, ask if the user wants you to fix the critical issues immediately
