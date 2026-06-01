import { useState } from 'react'

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
    <form onSubmit={handleSubmit} className="border-t border-[var(--border-light)] p-3">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 focus-within:border-[var(--accent)]/50 transition-colors duration-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to do anything..."
          disabled={disabled}
          className="flex-1 bg-transparent text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--error-dim)] text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="2" width="8" height="8" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-colors duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}
