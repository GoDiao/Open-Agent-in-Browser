import type { Conversation, StorageConfig, ThemeId } from '../core/types'

const DEFAULT_CONFIG: StorageConfig = {
  endpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  autoMemoryReview: true,
}

export async function getConfig(): Promise<StorageConfig> {
  const result = await chrome.storage.local.get('config')
  return { ...DEFAULT_CONFIG, ...(result.config as Partial<StorageConfig> | undefined) }
}

export async function setConfig(config: Partial<StorageConfig>): Promise<void> {
  const current = await getConfig()
  await chrome.storage.local.set({ config: { ...current, ...config } })
}

export async function getConversations(): Promise<Conversation[]> {
  const result = await chrome.storage.local.get('conversations')
  return (result.conversations as Conversation[] | undefined) || []
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const conversations = await getConversations()
  const index = conversations.findIndex((c) => c.id === conversation.id)
  if (index >= 0) {
    conversations[index] = conversation
  } else {
    conversations.unshift(conversation)
  }
  // Keep last 50 conversations
  await chrome.storage.local.set({ conversations: conversations.slice(0, 50) })
}

export async function deleteConversation(id: string): Promise<void> {
  const conversations = await getConversations()
  await chrome.storage.local.set({
    conversations: conversations.filter((c) => c.id !== id),
  })
}

export async function getTheme(): Promise<ThemeId> {
  const result = await chrome.storage.local.get('theme')
  return (result.theme as ThemeId) || 'cyber-obsidian'
}

export async function setTheme(theme: ThemeId): Promise<void> {
  await chrome.storage.local.set({ theme })
  document.documentElement.setAttribute('data-theme', theme)
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute('data-theme', theme)
}

// ─── Selected Text ───

export interface SelectedTextData {
  text: string
  pageUrl: string
  pageTitle: string
  tabId: number
  timestamp: number
}

export async function getSelectedTextMap(): Promise<Record<string, SelectedTextData>> {
  const result = await chrome.storage.local.get('selectedTextMap')
  return (result.selectedTextMap as Record<string, SelectedTextData> | undefined) || {}
}

export async function setSelectedText(tabIdKey: string, data: SelectedTextData): Promise<void> {
  const map = await getSelectedTextMap()
  map[tabIdKey] = data
  await chrome.storage.local.set({ selectedTextMap: map })
}

export async function getSelectedTextForTab(tabId: number): Promise<SelectedTextData | null> {
  const map = await getSelectedTextMap()
  return map[String(tabId)] || null
}

export async function clearSelectedText(tabIdKey: string): Promise<void> {
  const map = await getSelectedTextMap()
  delete map[tabIdKey]
  await chrome.storage.local.set({ selectedTextMap: map })
}
