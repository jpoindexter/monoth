---
name: design-system-audit
description: Audit code for design system violations - grid spacing, tokens, existing components
license: MIT
compatibility: Claude Code
metadata:
  version: "2.0"
  priority: critical
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Design System Audit - COMPREHENSIVE CHECK

## When to Use

Run this audit:
- Before committing code
- When reviewing PRs
- When asked to check compliance
- After creating new components/pages

---

## AUDIT CHECKLIST

### 1. Custom UI Violations (CRITICAL)

Search for custom UI that should use existing components:

```bash
# Custom buttons (should use <Button>)
grep -rn '<button' src/components/ src/app/ --include="*.tsx"

# Custom inputs (should use <Input>)
grep -rn '<input' src/components/ src/app/ --include="*.tsx" | grep -v "components/ui"

# Custom selects (should use <Select>)
grep -rn '<select' src/components/ src/app/ --include="*.tsx" | grep -v "components/ui"
```

**Fix:** Import from `@/components/ui/` instead

### 2. Grid Spacing Violations

**ALL spacing MUST use the project's design tokens. NO hardcoded Tailwind spacing.**

```bash
# Find ALL hardcoded spacing
grep -rn "\s[pm][tblrxy]\?-[1-9]" src/ --include="*.tsx" | grep -v "var(--"
grep -rn "gap-[1-9]" src/ --include="*.tsx" | grep -v "var(--"
grep -rn "space-[xy]-[1-9]" src/ --include="*.tsx" | grep -v "var(--"

# Off-grid heights
grep -rn 'h-7\|h-9\|h-11' src/ --include="*.tsx"
```

**Grid Scale (4px base unit) — adapt to your project's token names:**

| Token | Value | Use Case |
|-------|-------|----------|
| `--grid-1` | 4px | Micro: icon padding |
| `--grid-2` | 8px | Small: related items |
| `--grid-4` | 16px | Standard: 1 line-height |
| `--grid-6` | 24px | Medium: section headers |
| `--grid-8` | 32px | Large: between sections |
| `--grid-12` | 48px | XL: page sections |
| `--grid-16` | 64px | XXL: major divisions |

### 2b. Vertical Grid Violations (LINE-HEIGHT & COMPONENT HEIGHTS)

```bash
# Missing line-heights (potential grid violations)
grep -rn 'text-sm\|text-base\|text-lg' src/ --include="*.tsx" | grep -v "leading-"

# Interactive elements should be h-8 (32px) standard
grep -rn '<button\|<Button' src/ --include="*.tsx" | grep -v "h-6\|h-8\|h-10"
grep -rn '<input\|<Input' src/ --include="*.tsx" | grep -v "h-8"
```

**Fix:** Add explicit line-heights. Interactive elements should use h-8 (32px)

### 3. Color Violations (HARDCODED)

```bash
# Hardcoded background colors
grep -rn 'bg-gray\|bg-slate\|bg-zinc\|bg-neutral\|bg-stone' src/ --include="*.tsx"
grep -rn 'bg-red\|bg-orange\|bg-amber\|bg-yellow\|bg-lime' src/ --include="*.tsx"
grep -rn 'bg-green\|bg-emerald\|bg-teal\|bg-cyan\|bg-sky' src/ --include="*.tsx"
grep -rn 'bg-blue\|bg-indigo\|bg-violet\|bg-purple\|bg-fuchsia' src/ --include="*.tsx"
grep -rn 'bg-pink\|bg-rose' src/ --include="*.tsx"

# Hardcoded text colors
grep -rn 'text-gray\|text-slate\|text-zinc' src/ --include="*.tsx"
grep -rn 'text-blue\|text-red\|text-green' src/ --include="*.tsx"

# Hardcoded border colors
grep -rn 'border-gray\|border-slate\|border-blue' src/ --include="*.tsx"
```

**Fix:** Use the project's design token system for colors.

### 4. Typography Violations (RAW SIZES)

```bash
# Hardcoded text sizes
grep -rn 'text-xs\|text-sm\|text-base\|text-lg' src/ --include="*.tsx" | grep -v "mode\."
grep -rn 'text-xl\|text-2xl\|text-3xl\|text-4xl' src/ --include="*.tsx" | grep -v "mode\."
```

**Fix:** Use the project's typography tokens.

### 5. Border Radius Violations

```bash
# Hardcoded radius
grep -rn 'rounded-sm\|rounded-md\|rounded-lg\|rounded-xl' src/ --include="*.tsx"
grep -rn 'rounded-2xl\|rounded-3xl\|rounded-full' src/ --include="*.tsx" | grep -v Switch
```

**Fix:** Use the project's radius token for full borders, no radius for partial borders.

---

## REPORT FORMAT

```
===============================================
DESIGN SYSTEM AUDIT REPORT
===============================================

SUMMARY
-------
Total violations: X
Critical (custom UI): X
Spacing violations: X
Color violations: X
Typography violations: X
Radius violations: X

VIOLATIONS BY FILE
------------------

[CUSTOM UI] src/components/foo.tsx:42
  Found: <button className="...">
  Fix: Import Button from @/components/ui/button

[SPACING] src/components/bar.tsx:28
  Found: className="p-3 gap-5"
  Fix: Use design token spacing variables

[COLOR] src/app/page.tsx:15
  Found: className="bg-gray-100 text-blue-500"
  Fix: Use design token color classes

[TYPOGRAPHY] src/components/baz.tsx:55
  Found: className="text-xl font-bold"
  Fix: Use typography token

[RADIUS] src/components/card.tsx:12
  Found: className="border rounded-lg"
  Fix: Use radius token

===============================================
```
