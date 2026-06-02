import type { ChatMessage as ChatMessageType } from '../../core/types'
import { MessageToolCall, MessageToolResult, MessageResponse } from './ai-elements/message'
import { Shimmer } from './ai-elements/shimmer'
import { Reasoning } from './ai-elements/reasoning'
import { cn } from '../../lib/utils'

interface Props {
  message: ChatMessageType
  index: number
}

export function ChatMessage({ message, index }: Props) {
  const isUser = message.role === 'user'
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0

  return (
    <div
      className="group flex w-full flex-col py-3.5 px-4 hover:bg-muted/30 transition-colors duration-200 border-b border-border/30 animate-mechanical-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* 角色标识 */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn(
          "text-[10px] font-medium tracking-wide uppercase",
          isUser ? "text-muted-foreground/50" : "text-primary/60"
        )}>
          {isUser ? 'You' : 'Iris'}
        </span>
      </div>

      {/* 内容体 */}
      <div className={cn(
        "text-[13px] leading-[1.65] space-y-2.5",
        isUser ? "text-foreground/80" : "text-foreground"
      )}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <>
            {/* Reasoning panel */}
            {message.reasoning && (
              <Reasoning
                content={message.reasoning}
                isStreaming={message.isStreaming}
              />
            )}

            {/* 工具调用状态 */}
            {hasToolCalls && (
              <div className="space-y-1.5">
                {message.tool_calls!.map((tc, i) => (
                  <MessageToolCall
                    key={tc.id || i}
                    name={tc.function.name}
                    state={message.toolResult ? 'completed' : 'running'}
                  />
                ))}
              </div>
            )}

            {/* 工具结果（折叠） */}
            {message.toolResult && (
              <MessageToolResult state="completed" name={message.tool_calls?.[0]?.function.name}>
                {message.toolResult}
              </MessageToolResult>
            )}

            {/* 文本内容 */}
            {message.content ? (
              <Shimmer active={message.isStreaming}>
                <div className={message.isStreaming ? 'animate-text-reveal' : undefined}>
                  <MessageResponse>{message.content}</MessageResponse>
                </div>
              </Shimmer>
            ) : hasToolCalls ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground/60 text-xs">
                <span className="inline-block h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
                executing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground/60 text-xs">
                <span className="inline-block h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
                thinking...
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
