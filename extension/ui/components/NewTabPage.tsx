import { useEffect, useState } from 'react'
import { GlobeIcon, CameraIcon, FileTextIcon, MessageSquareIcon } from 'lucide-react'
import type { Conversation } from '../../core/types'
import { getConversations } from '../../lib/storage'

const QUICK_ACTIONS = [
  {
    icon: GlobeIcon,
    title: 'Navigate to...',
    subtitle: 'Open any website',
    message: 'Navigate to ',
  },
  {
    icon: CameraIcon,
    title: 'Take a screenshot',
    subtitle: 'Capture the current page',
    message: 'Take a screenshot of this page',
  },
  {
    icon: FileTextIcon,
    title: 'Summarize this page',
    subtitle: 'Get a quick summary',
    message: 'Summarize this page',
  },
]

export function NewTabPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    getConversations().then((convs) => setConversations(convs.slice(0, 5)))
  }, [])

  const handleAction = (message: string) => {
    // Open the sidepanel and send a message via background
    chrome.runtime.sendMessage({
      type: 'open-sidepanel',
      message,
    })
  }

  const handleConversationClick = (conv: Conversation) => {
    chrome.runtime.sendMessage({
      type: 'open-sidepanel',
      conversationId: conv.id,
    })
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground">
      {/* Hero */}
      <div className="mt-[15vh] flex flex-col items-center gap-4 animate-fade-in-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-orange/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Open Agent</h1>
        <p className="text-sm text-muted-foreground">
          Your AI-powered browser assistant
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-10 w-full max-w-xl px-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                onClick={() => handleAction(action.message)}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-orange/10 group-hover:bg-accent-orange/20 transition-colors">
                  <Icon className="h-4 w-4 text-accent-orange" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground">{action.subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Conversations */}
      {conversations.length > 0 && (
        <div className="mt-10 w-full max-w-xl px-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Recent Conversations
          </h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleConversationClick(conv)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
              >
                <MessageSquareIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.title || 'Untitled'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {conv.messages.length} messages &middot; {formatDate(conv.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-auto mb-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <p className="text-[11px] text-muted-foreground">
          Click the extension icon or press the sidepanel shortcut to start chatting
        </p>
      </div>
    </div>
  )
}
