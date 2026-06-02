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
    <div className="chat-input-wrapper border-t border-border/40">
      <form onSubmit={handleSubmit} className="flex items-center h-11 px-4">
        {attachedTabs && attachedTabs.length > 0 && (
          <div className="absolute bottom-13 left-4 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-card/90 backdrop-blur-sm px-2 py-1 border border-border/40">
            <GlobeIcon className="h-3 w-3" />
            <span className="truncate max-w-[260px]">
              {attachedTabs.length === 1
                ? attachedTabs[0].title || attachedTabs[0].url
                : `${attachedTabs.length} tabs attached`}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 w-full">
          <span className="text-primary/50 select-none text-xs">▸</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={disabled}
            className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-6 w-6 items-center justify-center text-destructive/70 hover:text-destructive transition-colors duration-150"
            >
              <SquareIcon className="h-3 w-3" fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className="flex h-6 w-6 items-center justify-center text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-all duration-150"
            >
              <ArrowUpIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
