import { useIsExpanded } from '@/components/layout/PanelWrapper'
import type { BriefSection } from '@/components/panels/daily-brief-utils'

export function DailyBriefAnalysis({ brief }: { brief: BriefSection[] }) {
  const expanded = useIsExpanded()

  return (
    <div className={`space-y-${expanded ? '3' : '2'}`}>
      {brief.map((section) => (
        <div key={section.title}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`font-semibold uppercase tracking-wider text-muted-foreground ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{section.title}</span>
            <span className={`font-bold uppercase tracking-wider px-1 py-px rounded-sm ${expanded ? 'text-[10px]' : 'text-[9px]'} ${
              section.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-600' :
              section.sentiment === 'bearish' ? 'bg-red-500/10 text-red-500' :
              'bg-amber-500/10 text-amber-600'
            }`}>
              {section.sentiment}
            </span>
          </div>
          <p className={`leading-relaxed text-foreground/80 ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{section.content}</p>
        </div>
      ))}
    </div>
  )
}
