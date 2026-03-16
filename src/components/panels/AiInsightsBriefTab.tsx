import { useIsExpanded } from '@/components/layout/PanelWrapper'

const LS_KEY = 'monoth-ai-key'

interface Props {
  isPro: boolean
  apiKey: string
  brief: string | null
  loading: boolean
  error: string | null
  onSaveKey: (val: string) => void
  onGenerate: () => void
}

export default function AiInsightsBriefTab({ isPro, apiKey, brief, loading, error, onSaveKey, onGenerate }: Props) {
  const expanded = useIsExpanded()

  return (
    <div>
      {!isPro && (
        <div className="mb-2">
          <div className="text-[10px] text-muted-foreground mb-1">Anthropic API key (stored locally)</div>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => onSaveKey(e.target.value)}
            className="w-full bg-transparent border border-border/30 rounded-sm px-1.5 py-0.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
          />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={loading || (!isPro && !apiKey.trim())}
        className="text-[10px] font-medium bg-foreground text-background px-2 py-1 rounded-sm disabled:opacity-50 mb-2"
      >
        {loading ? 'Generating...' : 'Generate Brief'}
      </button>

      {error && <p className="text-[10px] text-red-500 mb-1">{error}</p>}

      {brief && (
        <div className={`leading-relaxed text-foreground/80 whitespace-pre-line ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          {brief}
        </div>
      )}

      {!brief && !loading && !error && (
        <p className="text-[10px] text-muted-foreground">
          {isPro ? 'Generate an AI market analysis.' : 'Add API key above to generate briefs.'}
        </p>
      )}
    </div>
  )
}

export { LS_KEY }
