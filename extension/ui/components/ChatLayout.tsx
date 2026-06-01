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
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold">Open Agent</h1>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <button
            onClick={onOpenSettings}
            className="text-xs text-muted-foreground hover:text-foreground"
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
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">
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
