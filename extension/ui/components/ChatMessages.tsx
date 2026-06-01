import type { ChatMessage as ChatMessageType } from '../../core/types'
import { ChatMessage } from './ChatMessage'

interface Props {
  messages: ChatMessageType[]
}

export function ChatMessages({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center text-center animate-fade-in">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-dim)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
            Browser Agent
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-[200px] mb-5">
            I can navigate, click, fill forms, take screenshots, and more.
          </p>
          <div className="grid w-full max-w-[220px] gap-1.5">
            {[
              'Navigate to example.com',
              'Take a screenshot',
              'What\'s on this page?',
            ].map((suggestion) => (
              <div
                key={suggestion}
                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent-dim)] transition-all duration-200 cursor-default"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} index={i} />
      ))}
    </div>
  )
}
