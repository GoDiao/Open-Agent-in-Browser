import type { ChatMessage as ChatMessageType } from '../../core/types'
import { Message, MessageContent, MessageResponse, MessageToolCall, MessageToolResult } from './ai-elements/message'

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
        className="animate-fade-in-up"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <Message from="tool">
          <MessageContent>
            <MessageToolResult state="completed">
              {message.content}
            </MessageToolResult>
          </MessageContent>
        </Message>
      </div>
    )
  }

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <Message from={isUser ? 'user' : 'assistant'}>
        <MessageContent>
          {isUser ? (
            message.content
          ) : message.content ? (
            <MessageResponse>{message.content}</MessageResponse>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-orange animate-pulse" />
              thinking...
            </span>
          )}
        </MessageContent>
      </Message>
    </div>
  )
}
