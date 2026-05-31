import type { ChatMessage as ChatMessageType } from '../../core/types'

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'

  if (isTool) {
    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-[80%] rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
          <span className="font-semibold">Tool Result:</span>{' '}
          {message.content.length > 300
            ? message.content.slice(0, 300) + '...'
            : message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {message.content || '(thinking...)'}
      </div>
    </div>
  )
}
