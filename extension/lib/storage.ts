import type { Conversation, StorageConfig } from '../core/types'

const DEFAULT_CONFIG: StorageConfig = {
  endpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
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
