import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface PanelWrapperProps {
  title: string
  children?: React.ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function PanelWrapper({ title, children, loading, error, onRetry }: PanelWrapperProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="py-2 px-3 shrink-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-sm text-destructive">{error}</p>
            {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
