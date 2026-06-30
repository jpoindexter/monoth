export function SectionMark({ num, label, tag }: { num: string; label: string; tag: string }) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-800/60 py-3">
      <span className="font-mono text-[9px] tracking-[0.18em] text-zinc-400 uppercase">
        [{num}] {label}
      </span>
      <span className="font-mono text-[9px] tracking-[0.18em] text-zinc-400 uppercase">
        / / {tag}
      </span>
    </div>
  )
}

export function MockPanel({
  title, children, cols = 1,
}: { title: string; children: React.ReactNode; cols?: number }) {
  return (
    <div
      className="rounded-[2px] border border-zinc-800/80 bg-zinc-950/90 overflow-hidden"
      style={{ gridColumn: `span ${cols}` }}
    >
      <div className="px-3 py-1.5 border-b border-zinc-800/50 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-400">{title}</span>
        <div className="flex gap-1">
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

export const GitHubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
)

export const LogoMark = () => (
  <div className="w-5 h-5 rounded-[3px] bg-emerald-500 flex items-center justify-center shrink-0">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect x="0.5" y="0.5" width="3.5" height="3.5" rx="0.5" fill="black" />
      <rect x="6" y="0.5" width="3.5" height="3.5" rx="0.5" fill="black" />
      <rect x="0.5" y="6" width="3.5" height="3.5" rx="0.5" fill="black" />
      <rect x="6" y="6" width="3.5" height="3.5" rx="0.5" fill="black" />
    </svg>
  </div>
)