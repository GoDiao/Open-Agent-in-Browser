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
      className="animate-fade-in-up border-b border-border/30 px-4 py-3 hover:bg-muted/[0.02] transition-colors"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* 冷淡的身份标签 */}
      <div className="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
        {isUser ? '▲ USER' : '▼ IRIS'}
      </div>
      <Message from={isUser ? 'user' : 'assistant'}>
        <MessageContent>
          {isUser ? (
            message.content
          ) : message.content ? (
            <MessageResponse>{message.content}</MessageResponse>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              thinking...
            </span>
          )}
        </MessageContent>
      </Message>
    </div>
  )
}
