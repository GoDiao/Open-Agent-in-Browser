import type { ChatMessage as ChatMessageType } from '../../core/types'

interface Props {
  message: ChatMessageType
  index: number
}

export function ChatMessage({ message, index }: Props) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'

  if (isTool) {
    return (
      <div
        className="animate-fade-in-up flex justify-start mb-3"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="max-w-[85%] rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Tool Result
            </span>
          </div>
          <pre className="text-[11px] leading-relaxed text-[var(--text-secondary)] font-[var(--font-mono)] whitespace-pre-wrap break-words overflow-hidden max-h-[120px]">
            {message.content.length > 400
              ? message.content.slice(0, 400) + '...'
              : message.content}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`animate-fade-in-up flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? 'bg-[var(--accent)] text-white rounded-br-md'
            : 'bg-[var(--bg-surface)] text-[var(--text)] rounded-bl-md border border-[var(--border-light)]'
        }`}
      >
        {message.content || (
          <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-light)] animate-pulse" />
            thinking...
          </span>
        )}
      </div>
    </div>
  )
}
