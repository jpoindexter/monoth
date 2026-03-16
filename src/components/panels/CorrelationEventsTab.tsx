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

interface Props {
  eventList: CorrelationEvent[]
  loading: boolean
}

export function CorrelationEventsTab({ eventList, loading }: Props) {
  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">Indicator</th>
          <th className="text-right font-medium pb-1.5">Actual</th>
          <th className="text-right font-medium pb-1.5">Exp</th>
          <th className="text-right font-medium pb-1.5">Surprise</th>
        </tr>
      </thead>
      <tbody>
        {eventList.length === 0 && !loading && (
          <tr>
            <td colSpan={4} className="py-4 text-center text-muted-foreground text-[10px]">No events found</td>
          </tr>
        )}
        {eventList.map((event) => {
          const beat = event.surprise > 0
          return (
            <tr key={event.id} className="border-t border-border/20">
              <td className="py-0.5">
                <div className="font-medium text-foreground">{event.indicator}</div>
                <div className="text-[10px] text-muted-foreground">{event.country}</div>
              </td>
              <td className="text-right tabular-nums">{event.actual.toFixed(2)}</td>
              <td className="text-right tabular-nums text-muted-foreground">{event.expected.toFixed(2)}</td>
              <td className={`text-right tabular-nums font-medium ${beat ? 'text-emerald-600' : 'text-red-500'}`}>
                {beat ? '+' : ''}{event.surprise.toFixed(2)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
