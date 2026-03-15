---
name: react-best-practices
description: React and Next.js performance optimization and best practices from Vercel
license: MIT
compatibility: Claude Code
metadata:
  author: Vercel
  version: "1.0"
  priority: high
  source: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
allowed-tools:
  - Read
  - Grep
  - Glob
---

# React Best Practices (from Vercel Agent Skills)

## CRITICAL: Eliminating Waterfalls

### Always parallel fetch on the server

```tsx
// ❌ BAD - Sequential fetches (waterfall)
async function Page() {
  const data1 = await fetch('/api/data1');
  const data2 = await fetch('/api/data2'); // Waits for data1
  return <Component data1={data1} data2={data2} />;
}

// ✅ GOOD - Parallel fetches
async function Page() {
  const [data1, data2] = await Promise.all([
    fetch('/api/data1'),
    fetch('/api/data2')
  ]);
  return <Component data1={data1} data2={data2} />;
}
```

### Never fetch in Client Components during render

```tsx
// ❌ BAD - Client-side fetch during render
'use client';
function ClientComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(d => setData(d));
  }, []);
}

// ✅ GOOD - Pass data as props from Server Component
async function ServerComponent() {
  const data = await fetch('/api/data');
  return <ClientComponent data={data} />;
}
```

### Avoid client-only data libraries when SSR is possible

Prefer server-side data fetching over client libraries like SWR or React Query when possible.

---

## HIGH: Server-Side Performance

### Use React Server Components by default

- Don't add 'use client' unless you need:
  - useState, useEffect, or other hooks
  - Event handlers (onClick, onChange, etc.)
  - Browser-only APIs

### Avoid dynamic() for Server Components

```tsx
// ❌ BAD - Unnecessary dynamic import for Server Component
const ServerComponent = dynamic(() => import('./ServerComponent'));

// ✅ GOOD - Direct import for Server Components
import ServerComponent from './ServerComponent';
```

### Use Suspense for slow components

```tsx
// ✅ GOOD - Wrap slow components in Suspense
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
```

---

## HIGH: Bundle Size Optimization

### Lazy load heavy client components

```tsx
// ✅ GOOD - Lazy load heavy components
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />,
  ssr: false // Only if component can't render on server
});
```

### Avoid large dependencies

- Prefer date-fns over moment.js
- Prefer lucide-react over react-icons
- Use tree-shakeable libraries

### Don't import entire libraries

```tsx
// ❌ BAD - Imports entire lodash
import _ from 'lodash';
_.debounce(fn);

// ✅ GOOD - Imports only what's needed
import debounce from 'lodash/debounce';
debounce(fn);
```

---

## MEDIUM: Re-render Optimization

### Use React.memo for expensive components

```tsx
// ✅ GOOD - Memo for expensive renders
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
```

### Memoize expensive calculations

```tsx
// ✅ GOOD - useMemo for expensive calculations
const sortedItems = useMemo(() =>
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
```

### Avoid inline objects in JSX

```tsx
// ❌ BAD - Creates new object every render
<Component style={{ color: 'red' }} />

// ✅ GOOD - Stable reference
const style = { color: 'red' };
<Component style={style} />

// ✅ BETTER - Use Tailwind classes
<Component className="text-red-500" />
```

---

## MEDIUM: Client-Side Data Fetching

### Use SWR/React Query for client data

```tsx
// ✅ GOOD - SWR for client-side fetching
const { data, error } = useSWR('/api/data', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000
});
```

### Implement proper loading states

```tsx
// ✅ GOOD - Handle all states
if (error) return <ErrorBoundary error={error} />;
if (!data) return <Skeleton />;
return <DataDisplay data={data} />;
```

---

## MEDIUM: Rendering Performance

### Use CSS over JS for animations

```tsx
// ❌ BAD - JavaScript animation
const [x, setX] = useState(0);
useEffect(() => {
  const interval = setInterval(() => setX(x => x + 1), 16);
}, []);

// ✅ GOOD - CSS animation
<div className="animate-slide-in" />
```

### Virtualize long lists

```tsx
// ✅ GOOD - Virtual list for large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
}
```

---

## LOW: JavaScript Micro-optimizations

### Prefer const over let

```tsx
// ✅ GOOD
const value = compute();

// ❌ BAD (unless reassignment needed)
let value = compute();
```

### Use optional chaining

```tsx
// ✅ GOOD
const name = user?.profile?.name;

// ❌ BAD
const name = user && user.profile && user.profile.name;
```

### Prefer arrow functions for callbacks

```tsx
// ✅ GOOD - Arrow function
items.map(item => <Item key={item.id} {...item} />)

// ❌ BAD - Function keyword in callback
items.map(function(item) { return <Item key={item.id} {...item} /> })
```

---

## LOW: Advanced Patterns

### Use React.lazy for route-based code splitting

```tsx
// ✅ GOOD - Split by route
const SettingsPage = React.lazy(() => import('./pages/Settings'));
```

### Use useCallback for stable function references

```tsx
// ✅ GOOD - Stable callback
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);

// Pass to memoized children
<MemoizedList onItemClick={handleClick} />
```

### Prefer composition over prop drilling

```tsx
// ✅ GOOD - Composition pattern
function Layout({ children }) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

// Usage
<Layout>
  <SpecificContent data={data} />
</Layout>
```

---

## HIGH: Test Writing Best Practices

### Use retry() for polling/waiting, never setTimeout

```typescript
// ❌ BAD - Don't use setTimeout for waiting
await new Promise((resolve) => setTimeout(resolve, 1000));

// ✅ GOOD - Use retry() for polling/waiting
import { retry } from 'next-test-utils';
await retry(async () => {
  const text = await browser.elementByCss('p').text();
  expect(text).toBe('expected value');
});
```

### Prefer fixture directories over inline files

```typescript
// ✅ GOOD - Use a real directory with fixture files
const { next } = nextTestSetup({
  files: __dirname, // points to directory containing test fixtures
});

// ❌ AVOID - Inline file definitions are harder to maintain
const { next } = nextTestSetup({
  files: {
    'app/page.tsx': `export default function Page() { ... }`,
  },
});
```

### Use expect() assertions with retry()

```typescript
// ❌ DEPRECATED - Don't use check()
await check(() => browser.elementByCss('p').text(), /expected/);

// ✅ GOOD - Use retry() with expect()
await retry(async () => {
  const text = await browser.elementByCss('p').text();
  expect(text).toMatch(/expected/);
});
```

---

## Quick Reference Table

| Issue | Priority | Solution |
|-------|----------|----------|
| Sequential fetches | Critical | Use Promise.all() |
| Client fetch in render | Critical | Pass from Server Component |
| Missing 'use client' | High | Add only when needed |
| Large bundle | High | Lazy load, tree shake |
| setTimeout in tests | High | Use retry() instead |
| Inline test files | Medium | Use fixture directories |
| Unnecessary re-renders | Medium | memo, useMemo, useCallback |
| Long lists | Medium | Virtualization |
| Inline objects | Low | Extract to constants |
