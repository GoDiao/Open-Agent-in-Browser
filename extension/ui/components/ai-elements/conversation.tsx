import type { ComponentProps } from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { cn } from '../../../lib/utils'

export type ConversationProps = ComponentProps<typeof StickToBottom>

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn(
      'styled-scrollbar relative flex-1 overflow-y-hidden',
      className,
    )}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
)

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content
    className={cn('flex flex-col gap-2 p-4', className)}
    {...props}
  />
)

export type ConversationScrollButtonProps = ComponentProps<'button'>

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  if (isAtBottom) return null

  return (
    <button
      className={cn(
        'absolute right-4 bottom-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 shadow-sm',
        className,
      )}
      onClick={() => scrollToBottom()}
      type="button"
      {...props}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </button>
  )
}
