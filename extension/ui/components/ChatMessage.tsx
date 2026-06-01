import type { ChatMessage as ChatMessageType } from '../../core/types'
import { MessageToolCall, MessageToolResult } from './ai-elements/message'
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
      className="group flex w-full flex-col py-3 px-4 hover:bg-primary/[0.02] transition-colors duration-150 border-b border-border/20 animate-mechanical-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* 角色标识 */}
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-mono text-[10px] tracking-widest text-primary uppercase">
          {isUser ? 'USER_CMD' : 'IRIS_CORE'}
        </span>
      </div>

      {/* 内容体 */}
      <div className={cn(
        "text-sm leading-relaxed pl-2 border-l-2 space-y-2",
        isUser ? "text-primary font-medium border-primary/30" : "text-foreground border-transparent"
      )}>
        {isUser ? (
          message.content
        ) : (
          <>
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
              <div>{message.content}</div>
            ) : hasToolCalls ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                executing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                thinking...
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
