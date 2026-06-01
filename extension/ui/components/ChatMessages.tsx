import { Sparkles } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../../core/types'
import { Conversation, ConversationContent, ConversationScrollButton } from './ai-elements/conversation'
import { Suggestion, Suggestions } from './ai-elements/suggestion'
import { ChatMessage } from './ChatMessage'

interface Props {
  messages: ChatMessageType[]
  onSuggestionClick?: (text: string) => void
}

export function ChatMessages({ messages, onSuggestionClick }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-fade-in">
        {/* Iris 标志 */}
        <div className="mb-5 flex h-12 w-12 items-center justify-center bg-primary/[0.06] text-primary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h2 className="mb-1.5 text-sm font-semibold tracking-tight text-foreground">
          Iris
        </h2>
        <p className="max-w-[220px] text-muted-foreground text-xs leading-relaxed mb-8">
          Browser automation agent. Navigate, interact, extract, and automate with precision.
        </p>

        {/* 建议卡片 */}
        <div className="w-full max-w-[280px] space-y-2">
          {[
            { label: 'Navigate to a website', cmd: 'Navigate to example.com' },
            { label: 'Take a screenshot', cmd: 'Take a screenshot of this page' },
            { label: 'Summarize this page', cmd: 'What is on this page?' },
          ].map((s) => (
            <button
              key={s.cmd}
              onClick={() => onSuggestionClick?.(s.cmd)}
              className="w-full text-left px-3 py-2.5 text-xs text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground hover:bg-primary/[0.02] transition-all duration-200"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} index={i} />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
