import type { ChatMessage } from '../../core/types'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { ToolResult } from './ToolResult'

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
  currentToolCall: { name: string; args: string } | null
  error: string | null
  onSend: (text: string) => void
  onStop: () => void
  onClear: () => void
  onOpenSettings: () => void
}

export function ChatLayout({
  messages,
  isStreaming,
  currentToolCall,
  error,
  onSend,
  onStop,
  onClear,
  onOpenSettings,
}: Props) {
  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-[var(--accent-dim)] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[var(--text)]">Open Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all duration-150"
          >
            Clear
          </button>
          <div className="w-px h-3 bg-[var(--border)]" />
          <button
            onClick={onOpenSettings}
            className="rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all duration-150"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} />

      {/* Tool execution indicator */}
      {currentToolCall && (
        <ToolResult name={currentToolCall.name} args={currentToolCall.args} />
      )}

      {/* Error */}
      {error && (
        <div className="animate-slide-up mx-4 mb-2 rounded-lg border border-[var(--error)]/20 bg-[var(--error-dim)] px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        disabled={false}
        isStreaming={isStreaming}
      />
    </div>
  )
}
