import type { ToolResult } from '../core/types'

export interface ExecutionRecord {
  id: string
  toolName: string
  args: string
  result: ToolResult
  timestamp: number
  duration: number
  conversationId?: string
  tabId?: number
  pageUrl?: string
}

const STORAGE_KEY = 'executionHistory'
const MAX_RECORDS = 200

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export async function getExecutionHistory(): Promise<ExecutionRecord[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as ExecutionRecord[] | undefined) || []
}

export async function addExecutionRecord(
  record: Omit<ExecutionRecord, 'id' | 'timestamp'>,
): Promise<ExecutionRecord> {
  const fullRecord: ExecutionRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  }

  const history = await getExecutionHistory()
  history.unshift(fullRecord)

  // Keep last MAX_RECORDS
  if (history.length > MAX_RECORDS) {
    history.length = MAX_RECORDS
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: history })
  return fullRecord
}

export async function clearExecutionHistory(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] })
}

export async function searchExecutionHistory(
  query: string,
  maxResults = 50,
): Promise<ExecutionRecord[]> {
  const history = await getExecutionHistory()
  const lower = query.toLowerCase()

  return history
    .filter(
      (r) =>
        r.toolName.toLowerCase().includes(lower) ||
        r.args.toLowerCase().includes(lower) ||
        (r.pageUrl && r.pageUrl.toLowerCase().includes(lower)),
    )
    .slice(0, maxResults)
}
