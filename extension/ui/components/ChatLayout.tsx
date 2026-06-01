import { SettingsIcon, TrashIcon } from 'lucide-react'
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
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-orange/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">Open Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
            title="Clear conversation"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
            title="Settings"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} onSuggestionClick={onSend} />

      {/* Tool execution indicator */}
      {currentToolCall && (
        <ToolResult name={currentToolCall.name} args={currentToolCall.args} />
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive animate-fade-in-up">
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
