---
name: component-create
description: Create React components using the project's existing design system primitives and tokens
license: MIT
compatibility: Claude Code
metadata:
  version: "2.0"
  priority: high
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Component Creation - STRICT RULES

## STOP! Before Creating ANYTHING

### Step 1: Check for existing components

```bash
# List all UI components in the project
ls src/components/ui/
```

### Step 2: Decision Tree

| Situation | Action |
|-----------|--------|
| Component exists | Use it directly |
| Can compose from existing primitives | Compose — don't build custom |
| Doesn't exist anywhere | Only then build custom |

**Check before building anything custom.**

---

### Step 3: Can You Compose From Existing?

**If the answer is YES, you MUST compose. Do NOT create new primitives.**

Common primitives to check:
- `@/components/ui/button`
- `@/components/ui/card`
- `@/components/ui/input`
- `@/components/ui/select`
- `@/components/ui/dialog`
- `@/components/ui/sheet`
- `@/components/ui/table`
- `@/components/ui/tabs`
- `@/components/ui/badge`
- `@/components/ui/switch`
- `@/components/ui/checkbox`
- `@/components/ui/tooltip`
- `@/components/ui/alert`
- `@/components/ui/alert-dialog`
- `@/components/ui/form`
- `@/components/ui/skeleton`

---

## Component Template (MANDATORY STRUCTURE)

```tsx
'use client'; // Only if hooks/interactivity needed

import * as React from 'react';
import { cn } from '@/lib/utils';

// Import from existing UI components
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface ComponentNameProps {
  /** Description of prop */
  title: string;
  /** Optional props use ? */
  description?: string;
  /** Always include className for composition */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComponentName({
  title,
  description,
  className,
}: ComponentNameProps) {
  return (
    <Card className={cn('border', className)}>
      <CardHeader>
        <h3>{title}</h3>
      </CardHeader>
      {description && (
        <CardContent>
          <p>{description}</p>
        </CardContent>
      )}
    </Card>
  );
}
```

---

## MANDATORY RULES

**NEVER hardcode values. ALWAYS use the project's design system tokens. If a token doesn't exist, ADD IT TO THE DESIGN SYSTEM FIRST.**

### 1. Colors

Use the project's design token system for all colors. Never use hardcoded Tailwind color classes like `bg-gray-100`, `text-blue-500`, `border-slate-200`, hex values, or `rgb()`/`hsl()`.

### 2. Typography

Use the project's typography tokens. Never use raw size classes like `text-xs`, `text-sm`, `text-lg`, `font-bold` directly — use the token system.

### 3. Spacing

Follow the project's spacing scale. Use CSS variables or tokens rather than arbitrary hardcoded values.

### 4. Border Radius

Use the project's radius token for full borders. Partial borders (border-b, border-t) should not have radius.

### 5. File Size

- **Max 150 lines per component file**
- If over, split into sub-components

### 6. Missing Token? ADD IT FIRST

If you need a style that doesn't have a token, add it to the design system first, then use it.

---

## BANNED PATTERNS

```tsx
// Custom button (use <Button> component)
<button className="px-4 py-2 rounded bg-blue-500">

// Custom modal (use <Dialog> component)
<div className="fixed inset-0 z-50 bg-black/50">

// Hardcoded colors/typography
className="text-sm bg-gray-100 text-blue-500"
```

---

## FILE LOCATIONS

- UI primitives: `src/components/ui/`
- Feature components: `src/components/{feature}/`
- Page components: `src/app/{route}/components/`
