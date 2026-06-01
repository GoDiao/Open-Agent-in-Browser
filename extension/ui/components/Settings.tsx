import { useEffect, useState } from 'react'
import type { StorageConfig } from '../../core/types'
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
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold">Settings</h1>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Back
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            API Endpoint
          </label>
          <input
            type="text"
            value={config.endpoint}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, endpoint: e.target.value }))
            }
            placeholder="https://api.openai.com/v1"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            OpenAI Compatible endpoint, e.g. http://localhost:11434/v1 for Ollama
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, apiKey: e.target.value }))
            }
            placeholder="sk-..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, model: e.target.value }))
            }
            placeholder="gpt-4o"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  )
}
