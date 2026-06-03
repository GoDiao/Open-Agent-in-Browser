import { ArrowLeftIcon, RefreshCcwIcon, HeartIcon, MessageSquareIcon, ShieldIcon, SettingsIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { SoulData } from '../../lib/soul'
import { getSoul, updateSoul, resetSoul } from '../../lib/soul'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
}

export function SoulPanel({ onClose }: Props) {
  const [soul, setSoul] = useState<SoulData>(getSoul())
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const loadSoul = () => {
    setSoul(getSoul())
  }

  useEffect(() => {
    loadSoul()
  }, [])

  const startEdit = (field: string, current: string | string[]) => {
    setEditing(field)
    setEditValue(Array.isArray(current) ? current.join('\n') : current)
  }

  const handleSave = async () => {
    if (!editing) return
    const updates: Partial<SoulData> = {}
    if (editing === 'personality') updates.personality = editValue
    else if (editing === 'communicationStyle') updates.communicationStyle = editValue
    else if (editing === 'boundaries') updates.boundaries = editValue.split('\n').map(s => s.trim()).filter(Boolean)
    else if (editing === 'preferences') updates.preferences = editValue.split('\n').map(s => s.trim()).filter(Boolean)
    const result = await updateSoul(updates)
    if (result.success) {
      setSoul(result.data!)
      setEditing(null)
      setEditValue('')
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset SOUL to default? This cannot be undone.')) return
    const result = await resetSoul()
    if (result.success) {
      setSoul(result.data!)
    }
  }

  const sections = [
    { key: 'personality', label: 'Personality', icon: HeartIcon, value: soul.personality, desc: 'How AI describes itself' },
    { key: 'communicationStyle', label: 'Communication', icon: MessageSquareIcon, value: soul.communicationStyle, desc: 'How AI communicates' },
    { key: 'boundaries', label: 'Boundaries', icon: ShieldIcon, value: soul.boundaries.join('\n'), desc: 'Rules AI must not break', isArray: true },
    { key: 'preferences', label: 'Preferences', icon: SettingsIcon, value: soul.preferences.join('\n'), desc: 'Your preferences for AI', isArray: true },
  ]

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
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">SOUL</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-muted-foreground/50 hover:text-destructive transition-colors"
        >
          <RefreshCcwIcon className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Info */}
      <div className="px-4 py-2 border-b border-border/40">
        <p className="text-[10px] font-mono text-muted-foreground/50 leading-relaxed">
          SOUL defines how Iris behaves — personality, communication style, and boundaries.
          Separate from Memory which stores facts about you.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {sections.map(({ key, label, icon: Icon, value, desc, isArray }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon className="h-3 w-3 text-primary/50" />
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                {label}
              </span>
            </div>
            {editing === key ? (
              <div className="space-y-2 animate-fade-in-up">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={isArray ? 'One per line' : 'Enter value...'}
                  className="w-full bg-background/50 border border-border/40 p-2.5 text-[12px] text-foreground outline-none focus:border-primary/40 resize-none min-h-[80px] font-mono placeholder:text-muted-foreground/25"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setEditing(null); setEditValue('') }}
                    className="px-2.5 py-1 text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-2.5 py-1 text-[10px] font-mono bg-primary/20 text-primary/80 hover:bg-primary/30 hover:text-primary transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startEdit(key, value)}
                className="w-full text-left group border border-border/30 hover:border-border/60 transition-colors duration-150 p-2.5"
              >
                {value ? (
                  <p className="text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">
                    {value}
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground/25 italic font-mono">
                    Click to edit {desc}
                  </p>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 px-4 py-2">
        <p className="text-[9px] font-mono text-muted-foreground/30 text-center">
          You can also ask Iris to change these during conversation
        </p>
      </div>
    </div>
  )
}