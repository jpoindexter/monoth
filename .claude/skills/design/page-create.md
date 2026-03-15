---
name: page-create
description: Create new Next.js App Router pages using project templates and patterns
license: MIT
compatibility: Claude Code
metadata:
  version: "1.0"
allowed-tools:
  - Read
  - Write
  - Glob
---

# Page Creation Skill

## When to use this skill
Use when creating new pages in a Next.js App Router application.

## Check Available Templates First

```bash
ls src/components/templates/
```

Reuse existing page templates before building new ones.

## Page Structure

### Server Component (default)
```tsx
import { TemplateName } from '@/components/templates';

export const metadata = {
  title: 'Page Title | Site Name',
  description: 'Page description for SEO',
};

export default function PageName() {
  return (
    <TemplateName
      title="Page Title"
      description="Page description"
    >
      {/* Page content */}
    </TemplateName>
  );
}
```

### Client Component (with interactivity)
```tsx
'use client';

import { useState } from 'react';
import { TemplateName } from '@/components/templates';

export default function PageName() {
  const [state, setState] = useState('');

  // All hooks BEFORE any early returns

  return (
    <TemplateName
      title="Page Title"
      description="Page description"
    >
      {/* Interactive content */}
    </TemplateName>
  );
}
```

### With Data Fetching
```tsx
import { notFound } from 'next/navigation';
import { PageClient } from './page-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `${slug} | Site Name`,
  };
}

export default async function PageName({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchData(slug);

  if (!data) {
    notFound();
  }

  return <PageClient data={data} />;
}
```

## File Naming
- `page.tsx` - Main page component
- `page-client.tsx` - Client component (if needed)
- `loading.tsx` - Loading state
- `error.tsx` - Error boundary
- `components/` - Page-specific components

## Size Limits
- Pages: 200 lines max
- Extract hooks to `src/hooks/`
- Extract components to `components/`

## Spacing System

Follow the project's grid spacing system. Use CSS variables or tokens for all spacing — avoid hardcoded Tailwind values.

```tsx
// Use the project's spacing tokens
<header className="pb-[var(--grid-4)] mb-[var(--grid-8)]">
<main className="space-y-[var(--grid-8)]">
<section className="mt-[var(--grid-12)]">
```
