import type { HTMLAttributes } from 'react'
import { cn } from '../../../lib/utils'

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
      'flex w-fit flex-col gap-2 overflow-hidden text-sm',
      'group-[.is-user]:ml-auto group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-primary group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:text-primary-foreground',
      'group-[.is-assistant]:text-foreground',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

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
      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
      state === 'running' && 'border-accent-orange/30 bg-accent-orange/5 text-accent-orange',
      state === 'completed' && 'border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400',
      state === 'error' && 'border-destructive/30 bg-destructive/5 text-destructive',
      className,
    )}
    {...props}
  >
    {state === 'running' && (
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent-orange/30 border-t-accent-orange" />
    )}
    {state === 'completed' && (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    )}
    {state === 'error' && (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    )}
    <span className="font-medium font-mono">{name}</span>
    <span className="text-[10px] uppercase tracking-wider opacity-60">
      {state === 'running' ? 'Running' : state === 'completed' ? 'Done' : 'Error'}
    </span>
  </div>
)

export type MessageToolResultProps = HTMLAttributes<HTMLDivElement>

export const MessageToolResult = ({
  children,
  className,
  ...props
}: MessageToolResultProps) => (
  <div
    className={cn(
      'rounded-lg border border-border bg-muted/50 px-3 py-2',
      className,
    )}
    {...props}
  >
    <pre className="text-xs leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap break-words overflow-hidden max-h-[150px]">
      {children}
    </pre>
  </div>
)
