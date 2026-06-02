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
  ChevronDownIcon,
} from 'lucide-react'
import type { Conversation, StorageConfig, ThemeId, ProviderId } from '../../core/types'
import { cn } from '../../lib/utils'
import { getConfig, setConfig, getConversations, deleteConversation, getTheme, setTheme } from '../../lib/storage'

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

const THEMES: { id: ThemeId; name: string; desc: string; colors: string[] }[] = [
  {
    id: 'cyber-obsidian',
    name: 'Cyber Obsidian',
    desc: '黑客帝国精密监控终端',
    colors: ['oklch(0.12 0.002 200)', 'oklch(0.78 0.14 190)', 'oklch(0.95 0 0)'],
  },
  {
    id: 'industrial-bauhaus',
    name: 'Industrial Bauhaus',
    desc: '德系精密工业测温仪',
    colors: ['oklch(0.18 0.005 90)', 'oklch(0.62 0.12 45)', 'oklch(0.9 0.002 90)'],
  },
  {
    id: 'analog-laboratory',
    name: 'Analog Laboratory',
    desc: '流体实验室控制台',
    colors: ['oklch(0.14 0.006 140)', 'oklch(0.72 0.08 140)', 'oklch(0.85 0.005 140)'],
  },
  {
    id: 'monochrome-plex',
    name: 'Monochrome Plex',
    desc: 'IBM Plex Mono 极简单色',
    colors: ['rgb(32, 29, 29)', 'rgb(100, 98, 98)', 'rgb(253, 252, 252)'],
  },
]

const PROVIDERS: {
  id: ProviderId
  name: string
  endpoint: string
  models: string[]
}[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20250414'],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    endpoint: 'http://localhost:11434/v1',
    models: ['llama3', 'mistral', 'codellama', 'phi3', 'gemma'],
  },
  {
    id: 'custom',
    name: 'Custom',
    endpoint: '',
    models: [],
  },
]

export function OptionsPage() {
  const [config, setConfigState] = useState<StorageConfig>({
    endpoint: '',
    apiKey: '',
    model: '',
    provider: 'openai',
  })
  const [saved, setSaved] = useState(false)
  const [toolSettings, setToolSettings] = useState<ToolSettings>({})
  const [conversations, setConversationsState] = useState<Conversation[]>([])
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('cyber-obsidian')

  useEffect(() => {
    getConfig().then((c) => {
      setConfigState(c)
      // Auto-detect provider from endpoint
      if (!c.provider) {
        if (c.endpoint.includes('openai.com')) setConfigState((prev) => ({ ...prev, provider: 'openai' }))
        else if (c.endpoint.includes('anthropic.com')) setConfigState((prev) => ({ ...prev, provider: 'anthropic' }))
        else if (c.endpoint.includes('localhost:11434')) setConfigState((prev) => ({ ...prev, provider: 'ollama' }))
        else setConfigState((prev) => ({ ...prev, provider: 'custom' }))
      }
    })
    getConversations().then(setConversationsState)
    getTheme().then(setCurrentTheme)
    chrome.storage.local.get('toolSettings').then((result) => {
      const stored = (result.toolSettings as ToolSettings | undefined) || {}
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

  const handleProviderChange = (providerId: ProviderId) => {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    if (provider) {
      setConfigState((c) => ({
        ...c,
        provider: providerId,
        endpoint: provider.endpoint,
        model: provider.models[0] || c.model,
      }))
    }
  }

  const handleThemeChange = async (themeId: ThemeId) => {
    setCurrentTheme(themeId)
    await setTheme(themeId)
  }

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
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm px-6 py-3">
        <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
        <div>
          <h1 className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">Iris Settings</h1>
          <p className="text-[10px] text-muted-foreground/50">Configuration</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {/* ── Theme ── */}
        <section className="animate-fade-in-up space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Theme
          </h2>
          <div className="space-y-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 border transition-all duration-150 text-left',
                  currentTheme === t.id
                    ? 'border-primary/40 bg-primary/[0.06]'
                    : 'border-border/40 hover:border-primary/20 hover:bg-muted/30',
                )}
              >
                <div className="flex gap-0.5 shrink-0">
                  {t.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-foreground/85">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground/50">{t.desc}</div>
                </div>
                {currentTheme === t.id && (
                  <div className="w-1.5 h-1.5 bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── API Configuration ── */}
        <section className="animate-fade-in-up space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            API
          </h2>
          <div className="border border-border/50 p-4 space-y-3">
            {/* Provider selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Provider</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={cn(
                      'px-2.5 py-2 text-[11px] font-medium border transition-all duration-150 text-left',
                      config.provider === p.id
                        ? 'border-primary/40 bg-primary/[0.06] text-foreground'
                        : 'border-border/40 text-muted-foreground/60 hover:border-primary/20 hover:bg-muted/30',
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Model</label>
              {config.provider !== 'custom' ? (
                <div className="relative">
                  <select
                    value={config.model}
                    onChange={(e) =>
                      setConfigState((c) => ({ ...c, model: e.target.value }))
                    }
                    className="w-full appearance-none border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/40 transition-colors duration-200 cursor-pointer"
                  >
                    {PROVIDERS.find((p) => p.id === config.provider)?.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) =>
                    setConfigState((c) => ({ ...c, model: e.target.value }))
                  }
                  placeholder="model-name"
                  className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 transition-colors duration-200"
                />
              )}
            </div>

            {/* Endpoint (custom only) */}
            {config.provider === 'custom' && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Endpoint</label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) =>
                    setConfigState((c) => ({ ...c, endpoint: e.target.value }))
                  }
                  placeholder="https://api.example.com/v1"
                  className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 transition-colors duration-200"
                />
              </div>
            )}

            {/* API Key */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) =>
                  setConfigState((c) => ({ ...c, apiKey: e.target.value }))
                }
                placeholder={config.provider === 'ollama' ? 'Not required for local' : 'sk-...'}
                disabled={config.provider === 'ollama'}
                className={cn(
                  "w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 transition-colors duration-200",
                  config.provider === 'ollama' && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>

            <button
              onClick={handleSaveConfig}
              className={cn(
                'w-full px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-all duration-200',
                saved
                  ? 'text-green-600 dark:text-green-400 border border-green-500/30'
                  : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20',
              )}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckIcon className="h-3 w-3" /> Saved
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </section>

        {/* ── Tool Toggles ── */}
        <section className="animate-fade-in-up space-y-3" style={{ animationDelay: '100ms' }}>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Tools
          </h2>
          <div className="border border-border/50 divide-y divide-border/30">
            {TOOL_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.name} className="p-4">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Icon className="h-3 w-3 text-muted-foreground/45" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                      {category.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {category.tools.map((toolName) => {
                      const enabled = toolSettings[toolName]?.enabled ?? true
                      return (
                        <button
                          key={toolName}
                          onClick={() => handleToggleTool(toolName)}
                          className={cn(
                            'flex items-center justify-between border border-border/30 px-2.5 py-1.5 text-[11px] transition-all duration-150',
                            enabled
                              ? 'border-primary/25 text-foreground/85'
                              : 'text-muted-foreground/40',
                          )}
                        >
                          <span className="font-mono">{toolName}</span>
                          <div
                            className={cn(
                              'w-1.5 h-1.5 transition-colors duration-200',
                              enabled ? 'bg-primary/70' : 'bg-muted-foreground/25',
                            )}
                          />
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
        <section className="animate-fade-in-up space-y-3" style={{ animationDelay: '200ms' }}>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <div className="border border-border/50 p-6 text-center">
              <p className="text-[11px] text-muted-foreground/40">No conversations yet</p>
            </div>
          ) : (
            <div className="border border-border/50 divide-y divide-border/30">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-foreground/80 truncate">
                      {conv.title || 'Untitled'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/45">
                      {conv.messages.length} msg &middot; {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="ml-3 flex h-5 w-5 items-center justify-center text-muted-foreground/35 hover:text-destructive/70 transition-all duration-150"
                    title="Delete conversation"
                  >
                    <TrashIcon className="h-3 w-3" />
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
