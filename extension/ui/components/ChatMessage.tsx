import type { ChatMessage as ChatMessageType } from '../../core/types'
import { Message, MessageContent, MessageResponse, MessageToolCall, MessageToolResult } from './ai-elements/message'
import { cn } from '../../lib/utils'

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
      className="group flex w-full flex-col py-3 px-4 hover:bg-primary/[0.02] transition-colors duration-150 border-b border-border/20 animate-mechanical-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* 侧边栏式的时间戳/角色标识 */}
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-mono text-[10px] tracking-widest text-primary uppercase">
          {isUser ? 'USER_CMD' : 'IRIS_CORE'}
        </span>
      </div>

      {/* 内容体 */}
      <div className={cn(
        "text-sm leading-relaxed pl-2 border-l-2",
        isUser ? "text-primary font-medium border-primary/30" : "text-foreground border-transparent"
      )}>
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
      </div>
    </div>
  )
}
