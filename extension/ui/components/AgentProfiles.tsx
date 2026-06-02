import { useEffect, useState } from 'react'
import { ArrowLeftIcon, TrashIcon, PlusIcon, CheckIcon, EditIcon } from 'lucide-react'
import type { AgentProfile } from '../../lib/agents'
import {
  getAgentProfiles,
  saveAgentProfile,
  updateAgentProfile,
  deleteAgentProfile,
  getActiveProfileId,
  setActiveProfileId,
  DEFAULT_PROFILES,
} from '../../lib/agents'
import type { LLMConfig } from '../../core/types'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
}

export function AgentProfiles({ onClose }: Props) {
  const [profiles, setProfiles] = useState<AgentProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    endpoint: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
    systemPrompt: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [profilesData, active] = await Promise.all([
      getAgentProfiles(),
      getActiveProfileId(),
    ])
    setProfiles(profilesData)
    setActiveId(active)
  }

  const handleCreate = async () => {
    if (!newProfile.name) return

    await saveAgentProfile({
      name: newProfile.name,
      description: newProfile.description,
      config: {
        endpoint: newProfile.endpoint,
        apiKey: newProfile.apiKey,
        model: newProfile.model,
      },
      systemPrompt: newProfile.systemPrompt || undefined,
    })

    setShowCreate(false)
    resetForm()
    loadData()
  }

  const handleUpdate = async () => {
    if (!editingId || !newProfile.name) return

    await updateAgentProfile(editingId, {
      name: newProfile.name,
      description: newProfile.description,
      config: {
        endpoint: newProfile.endpoint,
        apiKey: newProfile.apiKey,
        model: newProfile.model,
      },
      systemPrompt: newProfile.systemPrompt || undefined,
    })

    setEditingId(null)
    resetForm()
    loadData()
  }

  const handleEdit = (profile: AgentProfile) => {
    setEditingId(profile.id)
    setNewProfile({
      name: profile.name,
      description: profile.description,
      endpoint: profile.config.endpoint,
      apiKey: profile.config.apiKey,
      model: profile.config.model,
      systemPrompt: profile.systemPrompt || '',
    })
    setShowCreate(true)
  }

  const handleDelete = async (id: string) => {
    await deleteAgentProfile(id)
    if (activeId === id) {
      await setActiveProfileId(null)
    }
    loadData()
  }

  const handleSetActive = async (id: string) => {
    const newActiveId = activeId === id ? null : id
    await setActiveProfileId(newActiveId)
    setActiveId(newActiveId)
  }

  const resetForm = () => {
    setNewProfile({
      name: '',
      description: '',
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o',
      systemPrompt: '',
    })
  }

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
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">
            Agent Profiles
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {profiles.length} profiles
          </span>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingId(null)
            setShowCreate(true)
          }}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors duration-150"
          title="Create profile"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {showCreate ? (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
              {editingId ? 'Edit Profile' : 'New Profile'}
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Name</label>
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                placeholder="My Agent"
                className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Description</label>
              <input
                type="text"
                value={newProfile.description}
                onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                placeholder="What does this agent do?"
                className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Endpoint</label>
              <input
                type="text"
                value={newProfile.endpoint}
                onChange={(e) => setNewProfile({ ...newProfile, endpoint: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">API Key</label>
              <input
                type="password"
                value={newProfile.apiKey}
                onChange={(e) => setNewProfile({ ...newProfile, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Model</label>
              <input
                type="text"
                value={newProfile.model}
                onChange={(e) => setNewProfile({ ...newProfile, model: e.target.value })}
                placeholder="gpt-4o"
                className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                System Prompt <span className="text-muted-foreground/30">(optional)</span>
              </label>
              <textarea
                value={newProfile.systemPrompt}
                onChange={(e) => setNewProfile({ ...newProfile, systemPrompt: e.target.value })}
                placeholder="Custom instructions for this agent..."
                rows={3}
                className="w-full border border-border/40 bg-transparent px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={!newProfile.name}
                className={cn(
                  'flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-all',
                  newProfile.name
                    ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20'
                    : 'text-muted-foreground/40 border border-border/30 cursor-not-allowed',
                )}
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false)
                  setEditingId(null)
                }}
                className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60 border border-border/40 hover:bg-muted/30"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={cn(
                  'border border-border/40 p-3 transition-all',
                  activeId === profile.id && 'border-primary/40 bg-primary/[0.04]',
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-medium text-foreground/85 truncate">{profile.name}</p>
                      {activeId === profile.id && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-primary/60 bg-primary/10 px-1.5 py-0.5">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/50">{profile.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleSetActive(profile.id)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center transition-colors',
                        activeId === profile.id ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground',
                      )}
                      title={activeId === profile.id ? 'Deactivate' : 'Activate'}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleEdit(profile)}
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <EditIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground/30 hover:text-destructive/70 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40 font-mono">
                  <span>{profile.config.model}</span>
                  <span>·</span>
                  <span className="truncate">{profile.config.endpoint}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
