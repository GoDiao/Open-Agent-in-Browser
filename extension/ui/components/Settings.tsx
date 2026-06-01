import { ArrowLeftIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { StorageConfig, ThemeId } from '../../core/types'
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
]

export function Settings({ onClose }: Props) {
  const [config, setConfigState] = useState<StorageConfig>({
    endpoint: '',
    apiKey: '',
    model: '',
  })
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('cyber-obsidian')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getConfig().then(setConfigState)
    getTheme().then(setCurrentTheme)
  }, [])

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
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-semibold text-foreground">Settings</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── Theme Section ── */}
        <div className="animate-fade-in-up space-y-2.5" style={{ animationDelay: '0ms' }}>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Theme
          </label>
          <div className="space-y-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 border transition-all duration-150 text-left',
                  currentTheme === t.id
                    ? 'border-primary/50 bg-primary/[0.04]'
                    : 'border-border hover:border-primary/20 hover:bg-muted/30',
                )}
              >
                {/* Color preview swatches */}
                <div className="flex gap-1 shrink-0">
                  {t.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                </div>
                {currentTheme === t.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── API Config Section ── */}
        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '60ms' }}>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            API Endpoint
          </label>
          <input
            type="text"
            value={config.endpoint}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, endpoint: e.target.value }))
            }
            placeholder="https://api.openai.com/v1"
            className="w-full border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
          />
          <p className="text-[11px] text-muted-foreground">
            OpenAI Compatible — works with OpenAI, Ollama, LM Studio, etc.
          </p>
        </div>

        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '120ms' }}>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, apiKey: e.target.value }))
            }
            placeholder="sk-..."
            className="w-full border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
          />
        </div>

        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '180ms' }}>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, model: e.target.value }))
            }
            placeholder="gpt-4o"
            className="w-full border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
          />
        </div>

        <button
          onClick={handleSave}
          className={cn(
            'animate-fade-in-up w-full px-3 py-2.5 text-sm font-medium transition-all duration-200',
            saved
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
              : 'bg-primary text-primary-foreground hover:opacity-90',
          )}
          style={{ animationDelay: '240ms' }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
