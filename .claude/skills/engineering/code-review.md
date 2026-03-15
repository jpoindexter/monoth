---
name: code-review
description: Review code for project standards, design system, security, and best practices
---

# Code Review Skill

## When to use this skill
Use when reviewing code changes, PRs, or auditing existing code for quality.

## Review Checklist

### 1. Design System Compliance

**Spacing (8-point grid)**
- [ ] Only uses p-0, p-1, p-2, p-4, p-6, p-8, p-10, p-12
- [ ] No p-3, p-5, p-7, gap-3, gap-5, m-3, m-5

**Colors**
- [ ] Uses mode.color.* tokens
- [ ] No hardcoded colors (bg-gray-100, text-blue-500)

**Typography**
- [ ] Uses mode.typography.* tokens
- [ ] No raw text sizes (text-sm, text-xl)

**Radius**
- [ ] Full borders have mode.radius
- [ ] Partial borders have no radius

### 2. Component Patterns

**Imports**
- [ ] Uses cn from @/lib/utils
- [ ] Uses mode from @/design-system
- [ ] Uses UI primitives from @/components/ui/

**Props**
- [ ] Has TypeScript interface
- [ ] className prop for customization
- [ ] No unused props

### 3. File Organization

**Size Limits**
- [ ] Components ≤ 150 lines
- [ ] Pages ≤ 200 lines
- [ ] Hooks ≤ 100 lines
- [ ] API routes ≤ 150 lines

### 4. Security (OWASP Top 10)

- [ ] No eval() with user input
- [ ] Proper input validation
- [ ] CSRF protection for mutations
- [ ] No exposed secrets

## Review Output Format

```markdown
## CODE REVIEW SUMMARY

**Files Reviewed**: X
**Issues Found**: Y (Critical: A, Warning: B, Info: C)

### Critical Issues
- [SECURITY] file.tsx:42 - SQL injection vulnerability
- [DESIGN] component.tsx:15 - Hardcoded color breaks theming

### Warnings
- [PERF] hook.ts:28 - Missing dependency in useEffect
- [SIZE] page.tsx - 250 lines, exceeds 200 limit

### Approved Patterns
- Good use of design tokens
- Proper error handling
```
