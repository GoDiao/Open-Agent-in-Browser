import { useEffect, useState } from 'react'
import { GlobeIcon, CameraIcon, FileTextIcon, MessageSquareIcon, TrashIcon, PlusIcon, LinkIcon, ClockIcon, ArrowUpIcon } from 'lucide-react'
import type { Conversation } from '../../core/types'
import type { ScheduledTask } from '../../lib/scheduler'
import { getConversations, deleteConversation } from '../../lib/storage'
import { loadMemory, getUserFields } from '../../lib/memory'
import { getScheduledTasks, formatSchedule, formatNextRun } from '../../lib/scheduler'
import { cn } from '../../lib/utils'

interface QuickLink {
  id: string
  title: string
  url: string
  favicon?: string
}

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

const DEFAULT_LINKS: QuickLink[] = [
  { id: 'gmail', title: 'Gmail', url: 'https://mail.google.com' },
  { id: 'github', title: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', title: 'YouTube', url: 'https://youtube.com' },
  { id: 'twitter', title: 'X', url: 'https://x.com' },
]

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function NewTabPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([])
  const [showAddLink, setShowAddLink] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [userName, setUserName] = useState('')
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [quickInput, setQuickInput] = useState('')

  useEffect(() => {
    getConversations().then((convs) => setConversations(convs.slice(0, 5)))
    chrome.storage.local.get('quickLinks').then((result) => {
      const stored = result.quickLinks as QuickLink[] | undefined
      setQuickLinks(stored && stored.length > 0 ? stored : DEFAULT_LINKS)
    })

    // Load user name from memory
    loadMemory().then(() => {
      const fields = getUserFields()
      setUserName(fields.nickname || fields.name || '')
    })

    // Load scheduled tasks
    getScheduledTasks().then((all) => {
      setTasks(all.filter(t => t.enabled).slice(0, 3))
    })
  }, [])

  const handleAction = (message: string) => {
    chrome.runtime.sendMessage({
      type: 'open-sidepanel',
      message,
    })
  }

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickInput.trim()) return
    chrome.runtime.sendMessage({
      type: 'open-sidepanel',
      message: quickInput.trim(),
    })
    setQuickInput('')
  }

  const handleConversationClick = (conv: Conversation) => {
    chrome.runtime.sendMessage({
      type: 'open-sidepanel',
      conversationId: conv.id,
    })
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteConversation(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }

  const handleAddLink = async () => {
    if (!newLink.url) return
    let url = newLink.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    const link: QuickLink = {
      id: Date.now().toString(36),
      title: newLink.title || new URL(url).hostname,
      url,
    }
    const updated = [...quickLinks, link]
    setQuickLinks(updated)
    await chrome.storage.local.set({ quickLinks: updated })
    setNewLink({ title: '', url: '' })
    setShowAddLink(false)
  }

  const handleDeleteLink = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    const updated = quickLinks.filter((l) => l.id !== id)
    setQuickLinks(updated)
    await chrome.storage.local.set({ quickLinks: updated })
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
      {/* Hero — Greeting */}
      <div className="mt-[12vh] flex flex-col items-center gap-3 animate-fade-in-up">
        <h1 className="text-[15px] font-mono font-medium uppercase tracking-[0.2em] text-foreground/90">
          {getGreeting()}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-[11px] font-mono text-muted-foreground/60">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Input */}
      <div className="mt-6 w-full max-w-lg px-8 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <form onSubmit={handleQuickSubmit} className="chat-input-wrapper border border-border/40">
          <div className="flex items-center h-10 px-4">
            <span className="text-primary/50 select-none text-xs mr-2">▸</span>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Ask Iris anything..."
              className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="flex h-6 w-6 items-center justify-center text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-all duration-150"
            >
              <ArrowUpIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 w-full max-w-lg px-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/50">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                onClick={() => handleAction(action.message)}
                className="group flex flex-col items-start gap-1.5 bg-background p-4 text-left hover:bg-muted/40 transition-colors duration-150"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground/45 group-hover:text-primary/70 transition-colors" />
                <p className="text-[11px] font-medium text-foreground/85">{action.title}</p>
                <p className="text-[10px] text-muted-foreground/50">{action.subtitle}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 w-full max-w-lg px-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Quick Links
          </h2>
          <button
            onClick={() => setShowAddLink(!showAddLink)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-primary/70 transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            Add
          </button>
        </div>

        {/* Add link form */}
        {showAddLink && (
          <div className="mb-3 p-3 border border-border/40 animate-fade-in-up">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Title (optional)"
                className="flex-1 border-b border-border/40 bg-transparent px-0 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/35"
              />
              <input
                type="text"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="URL"
                className="flex-1 border-b border-border/40 bg-transparent px-0 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/35"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddLink}
                disabled={!newLink.url}
                className={cn(
                  'px-2 py-1 text-[10px] font-mono transition-all',
                  newLink.url
                    ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20'
                    : 'text-muted-foreground/40 border border-border/30',
                )}
              >
                Save
              </button>
              <button
                onClick={() => { setShowAddLink(false); setNewLink({ title: '', url: '' }) }}
                className="px-2 py-1 text-[10px] text-muted-foreground/50 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Links grid */}
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center gap-1.5 p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="h-8 w-8 flex items-center justify-center bg-muted/50 rounded-lg">
                {getFaviconUrl(link.url) ? (
                  <img
                    src={getFaviconUrl(link.url)}
                    alt=""
                    className="h-4 w-4"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <LinkIcon className={cn(
                  "h-4 w-4 text-muted-foreground/40",
                  getFaviconUrl(link.url) ? 'hidden' : '',
                )} />
              </div>
              <p className="text-[10px] text-foreground/70 truncate w-full text-center">
                {link.title}
              </p>
              <button
                onClick={(e) => handleDeleteLink(e, link.id)}
                className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:text-destructive/70 transition-all"
              >
                <TrashIcon className="h-2.5 w-2.5" />
              </button>
            </a>
          ))}
        </div>
      </div>

      {/* Scheduled Tasks */}
      {tasks.length > 0 && (
        <div className="mt-8 w-full max-w-lg px-8 animate-fade-in-up" style={{ animationDelay: '175ms' }}>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
            Scheduled Tasks
          </h2>
          <div className="divide-y divide-border/30">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2.5 py-2">
                <ClockIcon className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground/80 truncate">
                    {task.name || task.prompt.slice(0, 40)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/45">
                    {formatSchedule(task.schedule)} · {formatNextRun(task.nextRun)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      {conversations.length > 0 && (
        <div className="mt-8 w-full max-w-lg px-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
            Recent
          </h2>
          <div className="divide-y divide-border/30">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group flex items-center gap-2.5 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <button
                  onClick={() => handleConversationClick(conv)}
                  className="flex flex-1 items-center gap-2.5 text-left min-w-0"
                >
                  <MessageSquareIcon className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-foreground/80 truncate">
                      {conv.title || 'Untitled'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/45">
                      {conv.messages.length} msg &middot; {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="flex h-5 w-5 items-center justify-center shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:text-destructive/70 transition-all duration-150"
                  title="Delete conversation"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-auto mb-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <p className="text-[10px] font-mono text-muted-foreground/40">
          click icon or press sidepanel shortcut
        </p>
      </div>
    </div>
  )
}
