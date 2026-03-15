---
name: table-patterns
description: Create and enhance data tables with proper patterns, design tokens, and features
license: MIT
compatibility: Claude Code
metadata:
  version: "1.0"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Table Patterns Skill

## When to use this skill
Use when creating or modifying data tables. This skill ensures:
- Proper use of DataTable component and TanStack Table
- Design token compliance (no hardcoded colors)
- Loading states and empty states
- Accessibility and keyboard navigation

## Available Components

### Core Components
Located in `src/components/ui/data-table/`:

| Component | Purpose |
|-----------|---------|
| `DataTable` | Main table wrapper with TanStack Table |
| `DataTableToolbar` | Search, filters, export, column toggle |
| `DataTablePagination` | Page navigation controls |
| `DataTableColumnHeader` | Sortable column headers |
| `DataTableResizable` | Column resizing capability |
| `DataTableRowExpansion` | Expandable row details |
| `DataTableColumnReorder` | Drag-and-drop column ordering |
| `DataTableAdvancedFilter` | Complex filtering UI |
| `DataTableBulkActions` | Multi-row action toolbar |
| `DataTableDensity` | Row height presets (xs/sm/md/lg/xl) |
| `DataTableExport` | CSV/JSON export functionality |
| `DataTableFilterTabs` | Tab-based filtering |

## Basic Usage

```tsx
import { DataTable } from '@/components/ui/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={getVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
];

<DataTable
  columns={columns}
  data={data}
  searchKey="name"
  searchPlaceholder="Search..."
  density="md"
  striped={true}
  showExport={true}
  showColumnToggle={true}
  onRowClick={(row) => handleRowClick(row)}
/>
```

## Column Definition Patterns

### Basic Column
```tsx
{
  accessorKey: 'title',
  header: 'Title',
}
```

### Sortable Column with Custom Header
```tsx
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';

{
  accessorKey: 'name',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Name" />
  ),
}
```

### Column with Badge (DESIGN TOKEN COMPLIANT)
```tsx
import { Badge } from '@/components/ui/badge';

{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => {
    const status = row.original.status;

    // Use Badge variants — NOT hardcoded colors
    const variant = status === 'active' ? 'success'
      : status === 'pending' ? 'warning'
      : status === 'error' ? 'destructive'
      : 'secondary';

    return <Badge variant={variant}>{status}</Badge>;
  },
}
```

## CRITICAL: Color Token Compliance

### BANNED — Hardcoded Colors
```tsx
// NEVER DO THIS
const badgeColors = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};
```

### REQUIRED — Design Tokens
```tsx
// Use Badge component variants
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="secondary">Draft</Badge>
```

## Loading States

### Skeleton Loading
```tsx
import { Skeleton } from '@/components/ui/skeleton';

function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex p-4 border-b last:border-0">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1 mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Empty States

### Distinguish "No Data" vs "No Search Results"
```tsx
// No search results
{searchQuery && data.length === 0 && (
  <div className="text-center py-12">
    <h3>No results for "{searchQuery}"</h3>
    <p>Try adjusting your search or filters</p>
    <Button variant="outline" onClick={clearSearch}>Clear search</Button>
  </div>
)}

// Empty data
{!searchQuery && data.length === 0 && (
  <div className="text-center py-12">
    <h3>No items yet</h3>
    <p>Get started by creating your first item</p>
    <Button onClick={onCreate}>Create item</Button>
  </div>
)}
```

## Density Settings

Available density values (per Carbon Design System):
| Density | Row Height | Use Case |
|---------|------------|----------|
| `xs` | 24px | Compact data, dashboards |
| `sm` | 32px | Dense lists |
| `md` | 40px | Default, balanced |
| `lg` | 48px | Touch-friendly |
| `xl` | 64px | Prominent data |

```tsx
<DataTable
  density="md"
  striped={true}
/>
```

## Checklist

When creating or modifying tables:

- [ ] Uses `DataTable` component (not custom implementation)
- [ ] Column colors use design tokens (no bg-blue-500, etc.)
- [ ] Loading state implemented with skeletons
- [ ] Empty state distinguishes no-data vs no-results
- [ ] Badge/status columns use `Badge` component variants
- [ ] Density prop set appropriately
- [ ] Striped prop enabled for better row distinction
