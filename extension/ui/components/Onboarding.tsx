import { useState, useEffect } from 'react'
import { ArrowRightIcon, CheckIcon, KeyIcon, PaletteIcon, SparklesIcon } from 'lucide-react'
import type { ProviderId, ThemeId } from '../../core/types'
import { cn } from '../../lib/utils'
import { setConfig, setTheme } from '../../lib/storage'

interface Props {
  onComplete: () => void
}

const STEPS = [
  { id: 'welcome', icon: SparklesIcon, title: 'Welcome to Iris' },
  { id: 'provider', icon: KeyIcon, title: 'Choose Provider' },
  { id: 'theme', icon: PaletteIcon, title: 'Select Theme' },
] as const

const PROVIDERS: {
  id: ProviderId
  name: string
  desc: string
  endpoint: string
  models: string[]
}[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    desc: 'GPT-4o, GPT-4 Turbo',
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    desc: 'Claude Sonnet, Opus',
    endpoint: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514'],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    desc: 'Local models, free',
    endpoint: 'http://localhost:11434/v1',
    models: ['llama3'],
  },
  {
    id: 'custom',
    name: 'Custom',
    desc: 'OpenAI-compatible API',
    endpoint: '',
    models: [],
  },
]

const THEMES: { id: ThemeId; name: string; desc: string; colors: string[] }[] = [
  {
    id: 'cyber-obsidian',
    name: 'Cyber Obsidian',
    desc: 'Precision monitoring terminal',
    colors: ['oklch(0.12 0.002 200)', 'oklch(0.78 0.14 190)', 'oklch(0.95 0 0)'],
  },
  {
    id: 'industrial-bauhaus',
    name: 'Industrial Bauhaus',
    desc: 'German industrial design',
    colors: ['oklch(0.18 0.005 90)', 'oklch(0.62 0.12 45)', 'oklch(0.9 0.002 90)'],
  },
  {
    id: 'analog-laboratory',
    name: 'Analog Laboratory',
    desc: 'Fluid laboratory console',
    colors: ['oklch(0.14 0.006 140)', 'oklch(0.72 0.08 140)', 'oklch(0.85 0.005 140)'],
  },
  {
    id: 'monochrome-plex',
    name: 'Monochrome Plex',
    desc: 'IBM Plex Mono minimalism',
    colors: ['rgb(32, 29, 29)', 'rgb(100, 98, 98)', 'rgb(253, 252, 252)'],
  },
]

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState<ProviderId>('openai')
  const [apiKey, setApiKey] = useState('')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [theme, setThemeState] = useState<ThemeId>('cyber-obsidian')
  const [saving, setSaving] = useState(false)

  const currentStep = STEPS[step]

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    const selectedProvider = PROVIDERS.find((p) => p.id === provider)

    await setConfig({
      endpoint: provider === 'custom' ? customEndpoint : selectedProvider?.endpoint || '',
      apiKey,
      model: provider === 'custom' ? customModel : selectedProvider?.models[0] || '',
      provider,
    })

    await setTheme(theme)
    setSaving(false)
    onComplete()
  }

  const canProceed = () => {
    if (step === 0) return true
    if (step === 1) {
      if (provider === 'ollama') return true
      if (provider === 'custom') return customEndpoint && customModel
      return apiKey.length > 0
    }
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6">
        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'h-0.5 flex-1 transition-colors duration-300',
                i <= step ? 'bg-primary' : 'bg-border/50',
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="animate-fade-in-up">
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 flex items-center justify-center bg-primary/[0.08]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Iris</h1>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Precision viewport control for the active DOM.
                </p>
                <p className="text-xs text-muted-foreground/50 mt-3 leading-relaxed">
                  Browser automation agent. Navigate, interact, extract, and automate with precision.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Choose Provider</h2>
                <p className="text-xs text-muted-foreground/60 mt-1">Select your LLM provider</p>
              </div>

              <div className="space-y-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 border transition-all duration-150 text-left',
                      provider === p.id
                        ? 'border-primary/40 bg-primary/[0.06]'
                        : 'border-border/40 hover:border-primary/20 hover:bg-muted/30',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground/85">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground/50">{p.desc}</div>
                    </div>
                    {provider === p.id && (
                      <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* API Key input */}
              {provider !== 'ollama' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                    className="w-full border-b border-border/40 bg-transparent px-0 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 transition-colors duration-200"
                    autoFocus
                  />
                </div>
              )}

              {/* Custom endpoint */}
              {provider === 'custom' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
                      Endpoint
                    </label>
                    <input
                      type="text"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full border-b border-border/40 bg-transparent px-0 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 transition-colors duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
                      Model
                    </label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="model-name"
                      className="w-full border-b border-border/40 bg-transparent px-0 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 transition-colors duration-200"
                    />
                  </div>
                </div>
              )}

              {provider === 'ollama' && (
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                  Make sure Ollama is running locally. No API key needed.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Select Theme</h2>
                <p className="text-xs text-muted-foreground/60 mt-1">Choose your visual style</p>
              </div>

              <div className="space-y-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setThemeState(t.id)
                      document.documentElement.setAttribute('data-theme', t.id)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 border transition-all duration-150 text-left',
                      theme === t.id
                        ? 'border-primary/40 bg-primary/[0.06]'
                        : 'border-border/40 hover:border-primary/20 hover:bg-muted/30',
                    )}
                  >
                    <div className="flex gap-0.5 shrink-0">
                      {t.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-4 h-4"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground/85">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground/50">{t.desc}</div>
                    </div>
                    {theme === t.id && (
                      <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={cn(
              'text-xs text-muted-foreground/60 hover:text-foreground transition-colors',
              step === 0 && 'invisible',
            )}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono uppercase tracking-wider transition-all duration-200',
                canProceed()
                  ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20'
                  : 'text-muted-foreground/40 border border-border/30 cursor-not-allowed',
              )}
            >
              Continue
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono uppercase tracking-wider transition-all duration-200',
                saving
                  ? 'text-muted-foreground/40 border border-border/30'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {saving ? 'Saving...' : 'Get Started'}
              {!saving && <ArrowRightIcon className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
