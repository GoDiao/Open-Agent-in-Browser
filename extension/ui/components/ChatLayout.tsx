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
      <div className="flex h-11 items-center justify-between border-b border-border/60 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center text-primary/70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-foreground/90">Iris</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onClear}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground/60 hover:text-foreground/80 transition-colors duration-150"
            title="Clear conversation"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground/60 hover:text-foreground/80 transition-colors duration-150"
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
        <div className="mx-4 mb-2 border border-destructive/20 bg-destructive/[0.03] px-3 py-2 text-xs text-destructive/80 animate-fade-in-up">
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
