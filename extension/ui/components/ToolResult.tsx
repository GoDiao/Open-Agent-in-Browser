interface Props {
  name: string
  args: string
}

export function ToolResult({ name }: Props) {
  return (
    <div className="animate-slide-up flex items-center gap-2.5 mx-4 mb-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-dim)] px-3 py-2">
      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent-light)]" />
      <span className="text-xs text-[var(--accent-light)]">
        Running <span className="font-semibold font-[var(--font-mono)]">{name}</span>
      </span>
    </div>
  )
}
