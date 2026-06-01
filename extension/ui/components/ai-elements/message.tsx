import { ChevronDownIcon, WrenchIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { memo } from 'react'
import { Streamdown } from 'streamdown'
import { cn } from '../../../lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { CodeBlock } from './code-block'

// ── Message Shell ──

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: 'user' | 'assistant' | 'tool' | 'system'
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full max-w-[85%] flex-col gap-2',
      from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
      className,
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      'flex w-full flex-col gap-1 text-sm font-sans tracking-tight',
      // 用户发言：无背景，纯文本居右，右对齐，用冷峻的冰晶蓝标识
      'group-[.is-user]:ml-auto group-[.is-user]:text-right group-[.is-user]:text-primary group-[.is-user]:font-medium',
      // Agent发言：无背景，纯粹留白，像一页精确打印的数据
      'group-[.is-assistant]:text-foreground group-[.is-assistant]:pl-1',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

// ── Streaming Markdown Response ──

export type MessageResponseProps = {
  children: string
  className?: string
}

export const MessageResponse = memo(
  ({ children, className }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
      shikiTheme={['one-light', 'one-dark-pro']}
    >
      {children}
    </Streamdown>
  ),
  (prev, next) => prev.children === next.children,
)

MessageResponse.displayName = 'MessageResponse'

// ── Tool Call Status ──

export type MessageToolCallProps = HTMLAttributes<HTMLDivElement> & {
  name: string
  state: 'running' | 'completed' | 'error'
}

export const MessageToolCall = ({
  name,
  state,
  className,
  ...props
}: MessageToolCallProps) => (
  <div
    className={cn(
      'flex items-center gap-2 rounded-md border px-3 py-2 text-xs',
      state === 'running' && 'border-primary/20 bg-primary/5 text-primary',
      state === 'completed' && 'border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400',
      state === 'error' && 'border-destructive/20 bg-destructive/5 text-destructive',
      className,
    )}
    {...props}
  >
    {state === 'running' && (
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    )}
    {state === 'completed' && (
      <CheckCircleIcon className="h-3.5 w-3.5" />
    )}
    {state === 'error' && (
      <XCircleIcon className="h-3.5 w-3.5" />
    )}
    <span className="font-medium font-mono">{name}</span>
    <span className="text-[10px] uppercase tracking-wider opacity-60">
      {state === 'running' ? 'Running' : state === 'completed' ? 'Done' : 'Error'}
    </span>
  </div>
)

// ── Collapsible Tool Result ──

export type MessageToolResultProps = HTMLAttributes<HTMLDivElement> & {
  name?: string
  state?: 'running' | 'completed' | 'error'
}

export const MessageToolResult = ({
  children,
  name,
  state = 'completed',
  className,
  ...props
}: MessageToolResultProps) => (
  <Collapsible
    className={cn('not-prose w-full rounded-lg border border-border', className)}
    defaultOpen={false}
    {...props}
  >
    <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 px-3 py-2 hover:bg-accent/50 transition-colors duration-150">
      <div className="flex items-center gap-2">
        <WrenchIcon className="h-3.5 w-3.5 text-muted-foreground" />
        {name && (
          <span className="font-medium text-xs font-mono text-foreground">{name}</span>
        )}
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
          state === 'running' && 'bg-primary/10 text-primary',
          state === 'completed' && 'bg-green-500/10 text-green-600 dark:text-green-400',
          state === 'error' && 'bg-destructive/10 text-destructive',
        )}>
          {state === 'running' && <ClockIcon className="h-2.5 w-2.5 animate-pulse" />}
          {state === 'completed' && <CheckCircleIcon className="h-2.5 w-2.5" />}
          {state === 'error' && <XCircleIcon className="h-2.5 w-2.5" />}
          {state === 'running' ? 'Running' : state === 'completed' ? 'Done' : 'Error'}
        </span>
      </div>
      <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
      <div className="border-t border-border px-3 py-2">
        <pre className="text-xs leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap break-words overflow-hidden max-h-[200px]">
          {typeof children === 'string' ? children : JSON.stringify(children, null, 2)}
        </pre>
      </div>
    </CollapsibleContent>
  </Collapsible>
)
