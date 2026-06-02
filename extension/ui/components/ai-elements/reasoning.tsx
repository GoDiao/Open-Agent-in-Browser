import { BrainIcon, ChevronDownIcon, ClockIcon } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '../../../lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

type ReasoningProps = HTMLAttributes<HTMLDivElement> & {
  content?: string
  isStreaming?: boolean
  autoClose?: boolean
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function Reasoning({
  content,
  isStreaming = false,
  autoClose = true,
  className,
  ...props
}: ReasoningProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [duration, setDuration] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const hasContentRef = useRef(false)

  useEffect(() => {
    if (isStreaming && !hasContentRef.current && content) {
      hasContentRef.current = true
      startTimeRef.current = Date.now()
    }

    if (isStreaming) {
      const interval = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current)
      }, 100)
      return () => clearInterval(interval)
    }

    if (!isStreaming && hasContentRef.current && autoClose) {
      setDuration(Date.now() - startTimeRef.current)
      const timer = setTimeout(() => setIsOpen(false), 800)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, content, autoClose])

  if (!content && !isStreaming) return null

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('not-prose w-full', className)}
      {...props}
    >
      <CollapsibleTrigger className="group/trigger flex w-full items-center gap-2 px-1 py-1.5 hover:bg-accent/30 transition-colors duration-150 rounded-md">
        <BrainIcon className={cn(
          'h-3.5 w-3.5 transition-colors',
          isStreaming ? 'text-primary animate-pulse' : 'text-muted-foreground',
        )} />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {isStreaming ? 'Reasoning...' : 'Reasoning'}
        </span>
        {duration > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <ClockIcon className="h-2.5 w-2.5" />
            {formatDuration(duration)}
          </span>
        )}
        <ChevronDownIcon className="ml-auto h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
        <div className="px-1 pb-2">
          <div className="rounded-md bg-muted/30 border border-border/40 p-3">
            <pre className="text-xs leading-relaxed text-muted-foreground/80 font-mono whitespace-pre-wrap break-words">
              {content || (
                <span className="inline-flex items-center gap-1.5 text-primary/60">
                  <span className="inline-block h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
                  Thinking...
                </span>
              )}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
