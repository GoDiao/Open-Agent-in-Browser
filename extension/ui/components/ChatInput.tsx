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
    <form onSubmit={handleSubmit} className="border-t border-border px-4 py-2.5">
      {attachedTabs && attachedTabs.length > 0 && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
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
          'flex items-center gap-2 transition-colors duration-200',
        )}
      >
        <span className="font-mono text-xs text-muted-foreground select-none">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="COMMAND_INPUT"
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40 font-mono"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-6 w-6 items-center justify-center rounded-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
          >
            <SquareIcon className="h-2.5 w-2.5" fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all duration-150"
          >
            <ArrowUpIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </form>
  )
}
