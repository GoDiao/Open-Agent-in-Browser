import type { ChatMessage as ChatMessageType } from '../../core/types'
import { ChatMessage } from './ChatMessage'

interface Props {
  messages: ChatMessageType[]
}

export function ChatMessages({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Ask me anything — I can control your browser.
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}
    </div>
  )
}
