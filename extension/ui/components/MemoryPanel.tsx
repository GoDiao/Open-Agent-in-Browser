import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { MemoryTarget, UserFields } from '../../lib/memory'
import { addEntry, replaceEntry, removeEntry, setUserField } from '../../lib/memory'
import { useMemory } from '../hooks/useMemory'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
}

const TABS: { id: MemoryTarget; label: string; desc: string }[] = [
  { id: 'user', label: 'User Profile', desc: 'Who you are' },
  { id: 'memory', label: 'Notes', desc: 'What I\'ve learned' },
]

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  nickname: 'Nickname',
  email: 'Email',
  timezone: 'Timezone',
  language: 'Language',
  role: 'Role',
}

export function MemoryPanel({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<MemoryTarget>('user')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newText, setNewText] = useState('')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  const { entries, usage, userFields, refresh, saveFields } = useMemory(activeTab)

  const handleAdd = async () => {
    if (!newText.trim()) return
    await addEntry(activeTab, newText.trim())
    setNewText('')
    setAddingNew(false)
    refresh()
  }

  const handleReplace = async (index: number) => {
    if (!editText.trim()) return
    const oldText = entries[index]
    await replaceEntry(activeTab, oldText, editText.trim())
    setEditingIndex(null)
    setEditText('')
    refresh()
  }

  const handleRemove = async (index: number) => {
    await removeEntry(activeTab, entries[index])
    refresh()
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditText(entries[index])
  }

  const startFieldEdit = (key: string) => {
    setEditingField(key)
    setFieldValue(userFields[key] || '')
  }

  const handleFieldSave = async () => {
    if (!editingField) return
    await setUserField(editingField, fieldValue.trim())
    setEditingField(null)
    setFieldValue('')
    refresh()
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
        <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">Memory</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingIndex(null); setAddingNew(false); setEditingField(null) }}
            className={cn(
              'flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors duration-150 border-b',
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground/80',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Usage bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {TABS.find(t => t.id === activeTab)?.desc}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {usage.pct}% — {usage.current.toLocaleString()}/{usage.limit.toLocaleString()}
          </span>
        </div>
        <div className="h-0.5 w-full bg-border/40 overflow-hidden">
          <div
            className="h-full bg-primary/40 transition-all duration-300"
            style={{ width: `${usage.pct}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
        {/* Structured fields (user tab only) */}
        {activeTab === 'user' && (
          <div className="space-y-1 mb-3">
            {Object.entries(FIELD_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="group flex items-center gap-2 border border-border/20 hover:border-border/50 px-2.5 py-1.5 transition-colors duration-150"
              >
                <span className="text-[10px] font-mono text-muted-foreground/40 w-16 shrink-0 uppercase tracking-wider">
                  {label}
                </span>
                {editingField === key ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="flex-1 bg-transparent border-b border-primary/40 text-[12px] text-foreground outline-none py-0.5 font-mono"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleFieldSave(); if (e.key === 'Escape') { setEditingField(null); setFieldValue('') } }}
                    />
                    <button onClick={() => { setEditingField(null); setFieldValue('') }} className="text-muted-foreground/50 hover:text-foreground">
                      <XIcon className="h-3 w-3" />
                    </button>
                    <button onClick={handleFieldSave} className="text-primary/70 hover:text-primary">
                      <CheckIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startFieldEdit(key)}
                    className="flex-1 text-left text-[12px] font-mono text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {userFields[key] || <span className="text-muted-foreground/25 italic">empty</span>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Free-form entries */}
        {entries.map((entry, i) => (
          <div
            key={i}
            className="group border border-border/30 hover:border-border/60 transition-colors duration-150 animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
          >
            {editingIndex === i ? (
              <div className="p-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-transparent border border-border/40 p-2 text-[12px] text-foreground outline-none focus:border-primary/40 resize-none min-h-[60px] font-mono"
                  autoFocus
                />
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => { setEditingIndex(null); setEditText('') }}
                    className="flex h-6 w-6 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleReplace(i)}
                    className="flex h-6 w-6 items-center justify-center text-primary/70 hover:text-primary transition-colors"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2">
                <p className="flex-1 text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap break-words font-mono">
                  {entry}
                </p>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 pt-0.5">
                  <button
                    onClick={() => startEdit(i)}
                    className="flex h-5 w-5 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <PencilIcon className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(i)}
                    className="flex h-5 w-5 items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <TrashIcon className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {entries.length === 0 && !addingNew && activeTab === 'memory' && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
            <p className="text-[11px] font-mono">No entries yet</p>
            <p className="text-[10px] font-mono mt-1">Iris will save memories as you chat</p>
          </div>
        )}

        {/* Add new entry */}
        {addingNew ? (
          <div className="border border-primary/30 p-2 space-y-2 animate-fade-in-up">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={activeTab === 'user'
                ? 'e.g. Prefers concise answers, likes dark themes'
                : 'e.g. Project uses React + TypeScript, npm scripts in package.json'
              }
              className="w-full bg-transparent border border-border/40 p-2 text-[12px] text-foreground outline-none focus:border-primary/40 resize-none min-h-[60px] font-mono placeholder:text-muted-foreground/30"
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => { setAddingNew(false); setNewText('') }}
                className="flex h-6 w-6 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <XIcon className="h-3 w-3" />
              </button>
              <button
                onClick={handleAdd}
                className="flex h-6 w-6 items-center justify-center text-primary/70 hover:text-primary transition-colors"
              >
                <CheckIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border/30 text-muted-foreground/40 hover:text-foreground/60 hover:border-border/60 transition-all duration-150 text-[10px] font-mono uppercase tracking-wider"
          >
            <PlusIcon className="h-3 w-3" />
            Add entry
          </button>
        )}
      </div>
    </div>
  )
}
