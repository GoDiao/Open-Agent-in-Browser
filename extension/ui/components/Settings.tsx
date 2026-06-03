import { ArrowLeftIcon, ChevronDownIcon, BrainIcon, InfoIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { StorageConfig, ThemeId, ProviderId } from '../../core/types'
import { cn } from '../../lib/utils'
import { getConfig, setConfig, getTheme, setTheme } from '../../lib/storage'

interface Props {
  onClose: () => void
}

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

export function Settings({ onClose }: Props) {
  const [config, setConfigState] = useState<StorageConfig>({
    endpoint: '',
    apiKey: '',
    model: '',
    provider: 'openai',
  })
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('cyber-obsidian')
  const [saved, setSaved] = useState(false)

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
    getTheme().then(setCurrentTheme)
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

  const handleSave = async () => {
    await setConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleThemeChange = async (themeId: ThemeId) => {
    setCurrentTheme(themeId)
    await setTheme(themeId)
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-2.5">
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">Settings</span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── Theme Section ── */}
        <div className="animate-fade-in-up space-y-2" style={{ animationDelay: '0ms' }}>
          <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Theme
          </label>
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
        </div>

        {/* ── Privacy & Data Section ── */}
        <div className="animate-fade-in-up space-y-2" style={{ animationDelay: '30ms' }}>
          <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Privacy & Data
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 border border-border/40 hover:border-border/60 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <BrainIcon className="h-4 w-4 text-primary/60" />
                <span className="text-[12px] text-foreground/80">Auto memory extraction</span>
              </div>
              <input
                type="checkbox"
                checked={config.autoMemoryReview !== false}
                onChange={(e) => setConfigState((c) => ({ ...c, autoMemoryReview: e.target.checked }))}
                className="accent-primary"
              />
            </label>
            <div className="flex items-start gap-2 p-2 bg-muted/20 border border-border/30">
              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                When enabled, Iris automatically extracts and saves facts from your conversations.
                Disable to opt out of automatic memory extraction.
              </p>
            </div>
          </div>
        </div>

        {/* ── Provider Section ── */}
        <div className="animate-fade-in-up space-y-2" style={{ animationDelay: '60ms' }}>
          <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Provider
          </label>
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

        {/* ── Model Section ── */}
        <div className="animate-fade-in-up space-y-1" style={{ animationDelay: '90ms' }}>
          <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Model
          </label>
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

        {/* ── API Endpoint (for custom) ── */}
        {config.provider === 'custom' && (
          <div className="animate-fade-in-up space-y-1" style={{ animationDelay: '120ms' }}>
            <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
              API Endpoint
            </label>
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

        {/* ── API Key ── */}
        <div className="animate-fade-in-up space-y-1" style={{ animationDelay: '150ms' }}>
          <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            API Key
          </label>
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
          <p className="text-[9px] text-muted-foreground/40 mt-1">
            Stored locally in your browser. Keep your device secure.
          </p>
        </div>

        <button
          onClick={handleSave}
          className={cn(
            'animate-fade-in-up w-full px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-all duration-200',
            saved
              ? 'text-green-600 dark:text-green-400 border border-green-500/30'
              : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20',
          )}
          style={{ animationDelay: '240ms' }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
