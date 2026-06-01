import { ArrowLeftIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { StorageConfig } from '../../core/types'
import { cn } from '../../lib/utils'
import { getConfig, setConfig } from '../../lib/storage'

interface Props {
  onClose: () => void
}

export function Settings({ onClose }: Props) {
  const [config, setConfigState] = useState<StorageConfig>({
    endpoint: '',
    apiKey: '',
    model: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getConfig().then(setConfigState)
  }, [])

  const handleSave = async () => {
    await setConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '0ms' }}>
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
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
          />
          <p className="text-[11px] text-muted-foreground">
            OpenAI Compatible — works with OpenAI, Ollama, LM Studio, etc.
          </p>
        </div>

        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '60ms' }}>
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
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
          />
        </div>

        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '120ms' }}>
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
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring transition-colors duration-200"
          />
        </div>

        <button
          onClick={handleSave}
          className={cn(
            'animate-fade-in-up w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            saved
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
              : 'bg-primary text-primary-foreground hover:opacity-90',
          )}
          style={{ animationDelay: '180ms' }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
