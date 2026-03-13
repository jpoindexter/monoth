import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCorrelationEvents, useCorrelationMatrix } from '@/hooks/use-correlation-data'

interface CorrelationEvent {
  id: string
  indicator: string
  country: string
  actual: number
  expected: number
  previous: number
  surprise: number
  impact: 'high' | 'medium' | 'low'
  timestamp: number
  unit: string
}

interface CorrelationEntry {
  indicator: string
  symbol: string
  beatDirection: number
  missDirection: number
  confidence: number
}

const ASSETS = ['SPY', 'GLD', 'TLT', 'DXY', 'BTC-USD']

function impactVariant(impact: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (impact === 'high') return 'destructive'
  if (impact === 'medium') return 'default'
  return 'secondary'
}

function directionColor(value: number): string {
  if (value === 0) return 'bg-muted text-muted-foreground'
  const intensity = Math.min(Math.abs(value), 1)
  const alpha = Math.round(intensity * 100)
  if (value > 0) {
    if (alpha >= 70) return 'bg-green-600 text-white'
    if (alpha >= 40) return 'bg-green-500/70 text-white'
    return 'bg-green-500/40 text-green-900 dark:text-green-100'
  }
  if (alpha >= 70) return 'bg-red-600 text-white'
  if (alpha >= 40) return 'bg-red-500/70 text-white'
  return 'bg-red-500/40 text-red-900 dark:text-red-100'
}

function HeatmapCell({ value }: { value: number | undefined }) {
  if (value == null) {
    return <div className="flex items-center justify-center h-10 rounded text-xs text-muted-foreground bg-muted">—</div>
  }
  return (
    <div className={`flex items-center justify-center h-10 rounded text-xs font-mono font-semibold ${directionColor(value)}`}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}
    </div>
  )
}

export default function CorrelationPanel() {
  const events = useCorrelationEvents()
  const matrix = useCorrelationMatrix()

  const loading = events.loading && matrix.loading
  const error = events.error ?? matrix.error

  const eventList: CorrelationEvent[] = events.data ?? []
  const matrixList: CorrelationEntry[] = matrix.data ?? []

  const indicators = [...new Set(matrixList.map((e) => e.indicator))]

  const lookup = new Map<string, number>()
  for (const entry of matrixList) {
    lookup.set(`${entry.indicator}:${entry.symbol}`, entry.beatDirection)
  }

  return (
    <PanelWrapper title="Correlation Engine" loading={loading} error={error} onRetry={() => { events.refresh(); matrix.refresh() }}>
      <Tabs defaultValue="events" className="flex flex-col h-full">
        <TabsList className="shrink-0 mx-4 mt-2 w-fit">
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="matrix">Correlation Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="flex-1 overflow-auto mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Date</TableHead>
                <TableHead>Indicator</TableHead>
                <TableHead className="text-right w-20">Actual</TableHead>
                <TableHead className="text-right w-20">Expected</TableHead>
                <TableHead className="text-right w-24">Surprise</TableHead>
                <TableHead className="text-center w-20">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventList.length === 0 && !events.loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                    No events with both actual and expected values found
                  </TableCell>
                </TableRow>
              )}
              {eventList.map((event) => {
                const beat = event.surprise > 0
                return (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div>{event.indicator}</div>
                      {event.country && <div className="text-xs text-muted-foreground">{event.country}</div>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {event.actual.toFixed(2)}{event.unit ? ` ${event.unit}` : ''}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {event.expected.toFixed(2)}{event.unit ? ` ${event.unit}` : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={beat ? 'default' : 'destructive'} className={beat ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {beat ? '+' : ''}{event.surprise.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={impactVariant(event.impact)} className="text-xs">
                        {event.impact}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="matrix" className="flex-1 overflow-auto mt-0 p-4">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <div className="grid gap-1" style={{ gridTemplateColumns: `180px repeat(${ASSETS.length}, 80px)` }}>
                <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1">
                  Indicator
                </div>
                {ASSETS.map((asset) => (
                  <div key={asset} className="flex items-center justify-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1">
                    {asset}
                  </div>
                ))}

                {indicators.map((indicator) => (
                  <>
                    <div key={`label-${indicator}`} className="flex items-center text-sm font-medium pr-2">
                      {indicator}
                    </div>
                    {ASSETS.map((asset) => (
                      <HeatmapCell key={`${indicator}:${asset}`} value={lookup.get(`${indicator}:${asset}`)} />
                    ))}
                  </>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Cell = beat direction correlation</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-green-600" /> positive
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-red-600" /> negative
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PanelWrapper>
  )
}
