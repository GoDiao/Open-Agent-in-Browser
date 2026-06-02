import type { LLMConfig } from '../core/types'

export interface AgentProfile {
  id: string
  name: string
  description: string
  config: LLMConfig
  systemPrompt?: string
  enabledTools?: string[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'agentProfiles'

function generateId(): string {
  return 'agent_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export async function getAgentProfiles(): Promise<AgentProfile[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as AgentProfile[] | undefined) || []
}

export async function getAgentProfile(id: string): Promise<AgentProfile | null> {
  const profiles = await getAgentProfiles()
  return profiles.find(p => p.id === id) || null
}

export async function saveAgentProfile(
  profile: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<AgentProfile> {
  const profiles = await getAgentProfiles()
  const fullProfile: AgentProfile = {
    ...profile,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  profiles.push(fullProfile)
  await chrome.storage.local.set({ [STORAGE_KEY]: profiles })
  return fullProfile
}

export async function updateAgentProfile(
  id: string,
  updates: Partial<Omit<AgentProfile, 'id' | 'createdAt'>>,
): Promise<void> {
  const profiles = await getAgentProfiles()
  const index = profiles.findIndex(p => p.id === id)
  if (index >= 0) {
    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: Date.now(),
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: profiles })
  }
}

export async function deleteAgentProfile(id: string): Promise<void> {
  const profiles = await getAgentProfiles()
  await chrome.storage.local.set({
    [STORAGE_KEY]: profiles.filter(p => p.id !== id),
  })
}

export async function getActiveProfileId(): Promise<string | null> {
  const result = await chrome.storage.local.get('activeProfileId')
  return (result.activeProfileId as string | null) || null
}

export async function setActiveProfileId(id: string | null): Promise<void> {
  await chrome.storage.local.set({ activeProfileId: id })
}

export async function getActiveProfile(): Promise<AgentProfile | null> {
  const id = await getActiveProfileId()
  if (!id) return null
  return getAgentProfile(id)
}

// Default profiles
export const DEFAULT_PROFILES: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'General Assistant',
    description: 'Default browser automation agent',
    config: {
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o',
    },
  },
  {
    name: 'Code Helper',
    description: 'Focused on web development tasks',
    config: {
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o',
    },
    systemPrompt: 'You are a web development assistant. Help with HTML, CSS, JavaScript, and browser automation. Focus on clean, efficient code.',
  },
  {
    name: 'Data Extractor',
    description: 'Specialized in extracting and analyzing web data',
    config: {
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
    },
    systemPrompt: 'You are a data extraction specialist. Extract structured data from web pages efficiently. Use tables and JSON when appropriate.',
  },
]
