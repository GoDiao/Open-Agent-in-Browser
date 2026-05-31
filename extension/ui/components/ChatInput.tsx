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
    <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        disabled={disabled}
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Send
        </button>
      )}
    </form>
  )
}
