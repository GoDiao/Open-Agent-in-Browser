/**
 * Audit Log — records critical operations for security and troubleshooting.
 */

const AUDIT_STORAGE_KEY = 'auditLog'
const MAX_AUDIT_ENTRIES = 500

export type AuditAction =
  | 'agent_start'
  | 'agent_end'
  | 'tool_execution'
  | 'tool_error'
  | 'memory_update'
  | 'soul_update'
  | 'settings_change'
  | 'data_export'
  | 'data_import'
  | 'dangerous_action'
  | 'conversation_create'
  | 'conversation_delete'

export interface AuditEntry {
  id: string
  timestamp: number
  action: AuditAction
  details: string
  metadata?: Record<string, unknown>
}

let _loaded = false
let _entries: AuditEntry[] = []

/**
 * Load audit log from storage.
 */
export async function loadAuditLog(): Promise<void> {
  if (_loaded) return

  const result = await chrome.storage.local.get(AUDIT_STORAGE_KEY)
  _entries = (result[AUDIT_STORAGE_KEY] as AuditEntry[] | undefined) || []
  _loaded = true
}

/**
 * Get all audit entries.
 */
export function getAuditEntries(): AuditEntry[] {
  return [..._entries]
}

/**
 * Add an entry to the audit log.
 */
export async function logAuditEntry(
  action: AuditAction,
  details: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action,
    details,
    metadata,
  }

  _entries.push(entry)

  // Keep only recent entries
  if (_entries.length > MAX_AUDIT_ENTRIES) {
    _entries = _entries.slice(-MAX_AUDIT_ENTRIES)
  }

  await chrome.storage.local.set({
    [AUDIT_STORAGE_KEY]: _entries,
  })
}

/**
 * Clear all audit entries.
 */
export async function clearAuditLog(): Promise<void> {
  _entries = []
  await chrome.storage.local.set({ [AUDIT_STORAGE_KEY]: [] })
}

/**
 * Get audit entries filtered by action type.
 */
export function getAuditEntriesByAction(action: AuditAction): AuditEntry[] {
  return _entries.filter((entry) => entry.action === action)
}

/**
 * Get audit entries within a time range.
 */
export function getAuditEntriesInRange(startTime: number, endTime: number): AuditEntry[] {
  return _entries.filter(
    (entry) => entry.timestamp >= startTime && entry.timestamp <= endTime
  )
}

/**
 * Helper to log tool execution.
 */
export async function logToolExecution(
  toolName: string,
  args: Record<string, unknown>,
  success: boolean
): Promise<void> {
  await logAuditEntry(
    success ? 'tool_execution' : 'tool_error',
    `${toolName}(${JSON.stringify(args).slice(0, 100)})`,
    { toolName, success }
  )
}

/**
 * Helper to log dangerous actions.
 */
export async function logDangerousAction(
  action: string,
  details: string
): Promise<void> {
  await logAuditEntry('dangerous_action', details, { action })
}

/**
 * Helper to log data export.
 */
export async function logDataExport(target: string): Promise<void> {
  await logAuditEntry('data_export', `Exported ${target}`)
}

/**
 * Helper to log data import.
 */
export async function logDataImport(
  source: string,
  itemCount: number
): Promise<void> {
  await logAuditEntry('data_import', `Imported from ${source}: ${itemCount} items`)
}