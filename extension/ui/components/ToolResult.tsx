interface Props {
  name: string
  args: string
}

export function ToolResult({ name, args }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground bg-muted/30">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <span>Executing <strong>{name}</strong>...</span>
    </div>
  )
}
