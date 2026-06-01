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
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[var(--text)]">Settings</span>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all duration-150"
        >
          Back
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '0ms' }}>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            API Endpoint
          </label>
          <input
            type="text"
            value={config.endpoint}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, endpoint: e.target.value }))
            }
            placeholder="https://api.openai.com/v1"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50 transition-colors duration-200"
          />
          <p className="text-[10px] text-[var(--text-muted)]">
            OpenAI Compatible — works with OpenAI, Ollama, LM Studio, etc.
          </p>
        </div>

        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '60ms' }}>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, apiKey: e.target.value }))
            }
            placeholder="sk-..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50 transition-colors duration-200"
          />
        </div>

        <div className="animate-fade-in-up space-y-1.5" style={{ animationDelay: '120ms' }}>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Model
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) =>
              setConfigState((c) => ({ ...c, model: e.target.value }))
            }
            placeholder="gpt-4o"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50 transition-colors duration-200"
          />
        </div>

        <button
          onClick={handleSave}
          className="animate-fade-in-up w-full rounded-lg bg-[var(--accent)] px-3 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-light)] transition-colors duration-200"
          style={{ animationDelay: '180ms' }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
