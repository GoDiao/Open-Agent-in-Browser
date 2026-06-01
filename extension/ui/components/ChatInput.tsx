import { ArrowUpIcon, SquareIcon, GlobeIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import type { AttachedTab } from '../hooks/useChat'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  onStop: () => void
  isStreaming: boolean
  attachedTabs?: AttachedTab[]
}

export function ChatInput({ onSend, disabled, onStop, isStreaming, attachedTabs }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      {attachedTabs && attachedTabs.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <GlobeIcon className="h-3 w-3" />
          <span className="truncate max-w-[260px]">
            {attachedTabs.length === 1
              ? attachedTabs[0].title || attachedTabs[0].url
              : `${attachedTabs.length} tabs attached`}
          </span>
        </div>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 transition-colors duration-200',
          'focus-within:border-ring focus-within:bg-card',
        )}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Iris..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-150"
          >
            <SquareIcon className="h-3.5 w-3.5" fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-30 transition-all duration-150"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  )
}
