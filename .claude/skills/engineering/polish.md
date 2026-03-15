---
name: polish
description: "Systematic optimization pass that checks every dimension in one shot: dead code, bundle size, performance, security, accessibility, SEO, error handling, duplication, naming. Use when someone says: is this the best it can be, can it be improved, nothing else to improve."
---

# Polish

Run a single comprehensive optimization pass across ALL dimensions. The goal is to catch everything in one sweep so the user doesn't have to ask "anything else?" five times.

## Process

1. **Scan the codebase** — Read all relevant files in the project or the files specified by the user.

2. **Run through every dimension below**. Check each one. Do not skip any.

### Checklist

- **Dead code**: Unused imports, unreachable code paths, commented-out code, unused variables, unused functions, unused CSS classes, unused dependencies in package.json
- **Bundle size**: Unnecessarily large dependencies (moment.js vs dayjs, lodash vs native), tree-shaking issues, dynamic imports where appropriate
- **Performance bottlenecks**: Unnecessary re-renders, missing memoization (useMemo/useCallback where beneficial), unoptimized loops, synchronous operations that should be async, missing pagination, N+1 queries
- **Security holes**: Exposed secrets, missing input sanitization, unsafe raw HTML injection, missing CSRF protection, insecure cookies
- **Accessibility**: Missing alt text, missing ARIA labels, missing keyboard navigation, insufficient color contrast, missing focus indicators, missing skip links, form labels
- **SEO**: Missing meta tags, missing Open Graph tags, missing canonical URLs, missing structured data, missing sitemap, non-semantic HTML, missing heading hierarchy
- **Error handling gaps**: Unhandled promise rejections, missing try/catch blocks, missing error boundaries (React), generic error messages, missing fallback UI, missing retry logic for network requests
- **Code duplication**: Repeated logic that should be extracted into utilities, copy-pasted components with minor variations, repeated API call patterns
- **Naming clarity**: Vague variable names (data, result, item, temp), inconsistent naming conventions, misleading function names, abbreviations that hurt readability
- **Type safety**: Uses of `any`, missing return types, loose type assertions, missing null checks, optional chaining where nullability is unclear
- **Consistency**: Mixed formatting, inconsistent file structure, mixed import styles, inconsistent error handling patterns
- **Missing edge cases**: Empty states, loading states, error states, long text overflow, special characters, zero results, single item vs plural, offline handling

## Output Format

```
## Polish Report

### Improvements Made
1. [file] — What was changed and why
2. [file] — What was changed and why
...

### Checked and Clean (no issues found)
- Dead code: clean
- Bundle size: acceptable
- ...

### Remaining Suggestions (optional, lower priority)
- [file:line] — Suggestion that requires user decision
- ...

### Summary
- X issues found and fixed
- Y dimensions checked clean
- Z suggestions for user review
```

## Rules

- Actually fix the issues you find. Don't just list them — make the changes.
- If a fix requires a user decision (e.g., choosing between two approaches), list it in "Remaining Suggestions" and explain the tradeoff.
- If everything is genuinely clean, say so. Don't invent issues.
- Check ALL dimensions. The whole point of this skill is one pass, not multiple rounds.
- For each fix, briefly explain WHY it matters, not just what changed.
- Run the build/typecheck after making changes to confirm nothing broke.
