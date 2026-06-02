import { useEffect, useState } from 'react'
import { ArrowLeftIcon, TrashIcon, MessageSquareIcon } from 'lucide-react'
import type { Conversation } from '../../core/types'
import { getConversations, deleteConversation } from '../../lib/storage'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
  onSelect: (id: string) => void
}

function formatDate(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ConversationList({ onClose, onSelect }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    const data = await getConversations()
    setConversations(data)
  }

  const handleDelete = async (id: string) => {
    await deleteConversation(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">
            Conversations
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {conversations.length}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquareIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40">No conversations yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group',
                  selectedId === conv.id && 'bg-primary/[0.06]',
                )}
                onClick={() => handleSelect(conv.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground/85 truncate">
                    {conv.title || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground/45">
                      {conv.messages.length} messages
                    </p>
                    <span className="text-muted-foreground/20">·</span>
                    <p className="text-[10px] text-muted-foreground/45">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(conv.id)
                  }}
                  className="flex h-5 w-5 items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:text-destructive/70 transition-all duration-150"
                  title="Delete conversation"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
