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
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
          <Sparkles className="h-7 w-7 text-accent-orange" />
        </div>
        <h2 className="mb-1 font-semibold text-lg text-foreground">
          Browser Agent
        </h2>
        <p className="max-w-[200px] text-muted-foreground text-xs mb-6">
          I can navigate, click, fill forms, take screenshots, and automate your browser.
        </p>
        <Suggestions>
          <Suggestion onClick={() => onSuggestionClick?.('Navigate to example.com')}>
            Navigate to a website
          </Suggestion>
          <Suggestion onClick={() => onSuggestionClick?.('Take a screenshot of this page')}>
            Take a screenshot
          </Suggestion>
          <Suggestion onClick={() => onSuggestionClick?.('What is on this page?')}>
            Summarize this page
          </Suggestion>
        </Suggestions>
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
