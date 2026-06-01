import { useEffect, useState } from 'react'
import {
  TrashIcon,
  SettingsIcon,
  GlobeIcon,
  CameraIcon,
  MousePointerIcon,
  BookmarkIcon,
  ClockIcon,
  LayoutIcon,
  LayersIcon,
  DownloadIcon,
  TerminalIcon,
  NetworkIcon,
  CodeIcon,
  CheckIcon,
} from 'lucide-react'
import type { Conversation, StorageConfig } from '../../core/types'
import { cn } from '../../lib/utils'
import { getConfig, setConfig, getConversations, deleteConversation } from '../../lib/storage'

// Tool categories with their tools
const TOOL_CATEGORIES = [
  {
    name: 'Navigation',
    icon: GlobeIcon,
    tools: ['navigate', 'list_pages', 'new_page', 'close_page', 'go_back', 'go_forward', 'reload'],
  },
  {
    name: 'Snapshot',
    icon: CameraIcon,
    tools: ['take_screenshot', 'take_snapshot', 'get_page_content', 'evaluate_script'],
  },
  {
    name: 'Input',
    icon: MousePointerIcon,
    tools: ['click', 'fill', 'hover', 'scroll'],
  },
  {
    name: 'Bookmarks',
    icon: BookmarkIcon,
    tools: ['create_bookmark', 'search_bookmarks', 'get_bookmarks', 'update_bookmark', 'remove_bookmark', 'move_bookmark'],
  },
  {
    name: 'History',
    icon: ClockIcon,
    tools: ['search_history', 'get_recent_history', 'delete_history_url', 'delete_history_range'],
  },
  {
    name: 'Windows',
    icon: LayoutIcon,
    tools: ['list_windows', 'create_window', 'close_window', 'focus_window'],
  },
  {
    name: 'Tab Groups',
    icon: LayersIcon,
    tools: ['create_tab_group', 'list_tab_groups', 'close_tab_group'],
  },
  {
    name: 'Downloads',
    icon: DownloadIcon,
    tools: ['download_file', 'save_pdf', 'save_screenshot'],
  },
  {
    name: 'Console',
    icon: TerminalIcon,
    tools: ['get_console_logs'],
  },
  {
    name: 'Network',
    icon: NetworkIcon,
    tools: ['get_network_requests'],
  },
  {
    name: 'DOM',
    icon: CodeIcon,
    tools: ['get_dom', 'search_dom'],
  },
]

type ToolSettings = Record<string, { enabled: boolean }>

export function OptionsPage() {
  const [config, setConfigState] = useState<StorageConfig>({
    endpoint: '',
    apiKey: '',
    model: '',
  })
  const [saved, setSaved] = useState(false)
  const [toolSettings, setToolSettings] = useState<ToolSettings>({})
  const [conversations, setConversationsState] = useState<Conversation[]>([])

  useEffect(() => {
    getConfig().then(setConfigState)
    getConversations().then(setConversationsState)
    chrome.storage.local.get('toolSettings').then((result) => {
      const stored = (result.toolSettings as ToolSettings | undefined) || {}
      // Initialize all tools as enabled if not yet set
      const defaults: ToolSettings = {}
      for (const cat of TOOL_CATEGORIES) {
        for (const tool of cat.tools) {
          if (!(tool in stored)) {
            defaults[tool] = { enabled: true }
          }
        }
      }
      setToolSettings({ ...defaults, ...stored })
    })
  }, [])

  const handleSaveConfig = async () => {
    await setConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleToggleTool = async (toolName: string) => {
    const updated = {
      ...toolSettings,
      [toolName]: { enabled: !toolSettings[toolName]?.enabled },
    }
    setToolSettings(updated)
    await chrome.storage.local.set({ toolSettings: updated })
  }

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id)
    setConversationsState((prev) => prev.filter((c) => c.id !== id))
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-orange/10">
          <SettingsIcon className="h-4 w-4 text-accent-orange" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">Open Agent Settings</h1>
          <p className="text-xs text-muted-foreground">Configure your browser AI agent</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {/* ── API Configuration ── */}
        <section className="animate-fade-in-up space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            API Configuration
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Endpoint</label>
              <input
                type="text"
                value={config.endpoint}
                onChange={(e) =>
                  setConfigState((c) => ({ ...c, endpoint: e.target.value }))
                }
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
              />
              <p className="text-[11px] text-muted-foreground">
                OpenAI Compatible — works with OpenAI, Ollama, LM Studio, etc.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) =>
                  setConfigState((c) => ({ ...c, apiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Model</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) =>
                  setConfigState((c) => ({ ...c, model: e.target.value }))
                }
                placeholder="gpt-4o"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                saved
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                  : 'bg-primary text-primary-foreground hover:opacity-90',
              )}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckIcon className="h-3.5 w-3.5" /> Saved
                </span>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>
        </section>

        {/* ── Tool Toggles ── */}
        <section className="animate-fade-in-up space-y-4" style={{ animationDelay: '100ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tool Toggles
          </h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {TOOL_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.name} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {category.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.tools.map((toolName) => {
                      const enabled = toolSettings[toolName]?.enabled ?? true
                      return (
                        <button
                          key={toolName}
                          onClick={() => handleToggleTool(toolName)}
                          className={cn(
                            'flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all duration-150',
                            enabled
                              ? 'border-primary/30 bg-primary/5 text-foreground'
                              : 'border-border bg-background text-muted-foreground',
                          )}
                        >
                          <span className="font-mono">{toolName}</span>
                          <div
                            className={cn(
                              'flex h-4 w-7 items-center rounded-full px-0.5 transition-colors duration-200',
                              enabled ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start',
                            )}
                          >
                            <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Conversation Management ── */}
        <section className="animate-fade-in-up space-y-4" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.title || 'Untitled'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {conv.messages.length} messages &middot; {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="ml-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                    title="Delete conversation"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
