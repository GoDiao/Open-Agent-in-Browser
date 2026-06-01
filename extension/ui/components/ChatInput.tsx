import { ArrowUpIcon, SquareIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  onStop: () => void
  isStreaming: boolean
}

export function ChatInput({ onSend, disabled, onStop, isStreaming }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 transition-colors duration-200',
          'focus-within:border-ring',
        )}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to do anything..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-150"
          >
            <SquareIcon className="h-3.5 w-3.5" fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all duration-150"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  )
}
