/**
 * MemoryStore — persistent curated memory for Iris.
 *
 * Two stores:
 *   - memory: agent's notes (environment facts, conventions, lessons learned)
 *   - user: user profile with structured fields + free-form entries
 *
 * Stored in chrome.storage.local. Entries delimited by §.
 * Character limits control token budget in system prompt.
 */

const ENTRY_DELIMITER = '\n§\n'

export type MemoryTarget = 'memory' | 'user'

// ── Structured user profile fields ──

export interface UserFields {
  name: string
  nickname: string
  email: string
  timezone: string
  language: string
  role: string
  [key: string]: string // extensible
}

const EMPTY_USER_FIELDS: UserFields = {
  name: '',
  nickname: '',
  email: '',
  timezone: '',
  language: '',
  role: '',
}

export const USER_FIELD_KEYS = Object.keys(EMPTY_USER_FIELDS) as (keyof UserFields)[]

// ── Storage schema ──

interface MemoryStorageData {
  memoryEntries: string[]
  userEntries: string[]
  userFields: UserFields
}

const CHAR_LIMITS: Record<MemoryTarget, number> = {
  memory: 8000,
  user: 5000,
}

const STORAGE_KEY = 'memoryStore'

// ── Frozen snapshot for system prompt injection ──

let _frozenSnapshot: Record<MemoryTarget, string> = { memory: '', user: '' }

// ── Live state ──

let _memoryEntries: string[] = []
let _userEntries: string[] = []
let _userFields: UserFields = { ...EMPTY_USER_FIELDS }

function entriesFor(target: MemoryTarget): string[] {
  return target === 'user' ? _userEntries : _memoryEntries
}

function setEntries(target: MemoryTarget, entries: string[]): void {
  if (target === 'user') {
    _userEntries = entries
  } else {
    _memoryEntries = entries
  }
}

function charCount(target: MemoryTarget): number {
  const entries = entriesFor(target)
  let total = entries.join(ENTRY_DELIMITER).length
  // Include structured fields in user profile char count
  if (target === 'user') {
    const fieldsText = renderFields(_userFields)
    if (fieldsText) total += fieldsText.length + 2 // +2 for newlines
  }
  return total
}

function renderFields(fields: UserFields): string {
  const lines: string[] = []
  if (fields.name) lines.push(`Name: ${fields.name}`)
  if (fields.nickname) lines.push(`Nickname: ${fields.nickname}`)
  if (fields.email) lines.push(`Email: ${fields.email}`)
  if (fields.timezone) lines.push(`Timezone: ${fields.timezone}`)
  if (fields.language) lines.push(`Language: ${fields.language}`)
  if (fields.role) lines.push(`Role: ${fields.role}`)
  // Render any extra keys
  for (const key of Object.keys(fields)) {
    if (!USER_FIELD_KEYS.includes(key as keyof UserFields) && fields[key]) {
      lines.push(`${key}: ${fields[key]}`)
    }
  }
  return lines.join('\n')
}

function renderBlock(target: MemoryTarget, entries: string[]): string {
  const limit = CHAR_LIMITS[target]

  let content = ''
  if (target === 'user') {
    const fieldsText = renderFields(_userFields)
    if (fieldsText) content += fieldsText
    if (entries.length) {
      if (content) content += '\n'
      content += entries.join(ENTRY_DELIMITER)
    }
  } else {
    content = entries.join(ENTRY_DELIMITER)
  }

  if (!content.trim()) return ''

  const pct = Math.min(100, Math.round((content.length / limit) * 100))
  const header = target === 'user'
    ? `USER PROFILE (who the user is) [${pct}% — ${content.length.toLocaleString()}/${limit.toLocaleString()} chars]`
    : `MEMORY (personal notes) [${pct}% — ${content.length.toLocaleString()}/${limit.toLocaleString()} chars]`
  const separator = '═'.repeat(46)
  return `${separator}\n${header}\n${separator}\n${content}`
}

// ── Public API ──

export interface MemoryResult {
  success: boolean
  message?: string
  error?: string
  target?: MemoryTarget
  entries?: string[]
  usage?: string
  entryCount?: number
  currentEntries?: string[]
  matches?: string[]
}

/**
 * Load memory from chrome.storage.local and capture frozen snapshot.
 * Call this once at sidepanel open (session start).
 */
export async function loadMemory(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const data = result[STORAGE_KEY] as MemoryStorageData | undefined

  _memoryEntries = data?.memoryEntries ? [...new Set(data.memoryEntries)] : []
  _userEntries = data?.userEntries ? [...new Set(data.userEntries)] : []
  _userFields = { ...EMPTY_USER_FIELDS, ...(data?.userFields || {}) }

  // Capture frozen snapshot — never mutated mid-session
  _frozenSnapshot = {
    memory: renderBlock('memory', _memoryEntries),
    user: renderBlock('user', _userEntries),
  }
}

/**
 * Get the frozen snapshot for system prompt injection.
 * Returns the state captured at loadMemory() time, NOT the live state.
 */
export function getMemorySnapshot(): Record<MemoryTarget, string> & { userFields: UserFields } {
  return { ..._frozenSnapshot, userFields: { ..._userFields } }
}

/**
 * Persist current state to chrome.storage.local.
 */
async function persist(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      memoryEntries: _memoryEntries,
      userEntries: _userEntries,
      userFields: _userFields,
    } satisfies MemoryStorageData,
  })
}

/**
 * Set a structured user profile field.
 */
export async function setUserField(key: string, value: string): Promise<MemoryResult> {
  if (!key.trim()) return { success: false, error: 'Field key cannot be empty.' }

  _userFields = { ..._userFields, [key.trim()]: value.trim() }
  await persist()
  return { success: true, message: `Field '${key}' set.` }
}

/**
 * Get all user fields (live state, for UI).
 */
export function getUserFields(): UserFields {
  return { ..._userFields }
}

/**
 * Add a new entry to the specified store.
 */
export async function addEntry(target: MemoryTarget, content: string): Promise<MemoryResult> {
  content = content.trim()
  if (!content) return { success: false, error: 'Content cannot be empty.' }

  const entries = entriesFor(target)
  const limit = CHAR_LIMITS[target]

  if (entries.includes(content)) {
    return successResponse(target, 'Entry already exists (no duplicate added).')
  }

  const newEntries = [...entries, content]
  const newTotal = newEntries.join(ENTRY_DELIMITER).length

  if (newTotal > limit) {
    const current = charCount(target)
    return {
      success: false,
      error: `Memory at ${current.toLocaleString()}/${limit.toLocaleString()} chars. Adding this entry (${content.length} chars) would exceed the limit. Replace or remove existing entries first.`,
      currentEntries: entries,
      usage: `${current.toLocaleString()}/${limit.toLocaleString()}`,
    }
  }

  setEntries(target, newEntries)
  await persist()
  return successResponse(target, 'Entry added.')
}

/**
 * Replace an entry containing oldText substring with newContent.
 */
export async function replaceEntry(target: MemoryTarget, oldText: string, newContent: string): Promise<MemoryResult> {
  oldText = oldText.trim()
  newContent = newContent.trim()
  if (!oldText) return { success: false, error: 'oldText cannot be empty.' }
  if (!newContent) return { success: false, error: 'newContent cannot be empty. Use remove to delete entries.' }

  const entries = entriesFor(target)
  const matches = entries
    .map((e, i) => ({ entry: e, index: i }))
    .filter(({ entry }) => entry.includes(oldText))

  if (!matches.length) {
    return { success: false, error: `No entry matched '${oldText}'.` }
  }

  if (matches.length > 1) {
    const uniqueTexts = new Set(matches.map(m => m.entry))
    if (uniqueTexts.size > 1) {
      return {
        success: false,
        error: `Multiple entries matched '${oldText}'. Be more specific.`,
        matches: matches.map(m => m.entry.slice(0, 80) + (m.entry.length > 80 ? '...' : '')),
      }
    }
  }

  const idx = matches[0].index
  const limit = CHAR_LIMITS[target]
  const testEntries = [...entries]
  testEntries[idx] = newContent
  const newTotal = testEntries.join(ENTRY_DELIMITER).length

  if (newTotal > limit) {
    return {
      success: false,
      error: `Replacement would put memory at ${newTotal.toLocaleString()}/${limit.toLocaleString()} chars. Shorten the new content or remove other entries first.`,
    }
  }

  const newEntries = [...entries]
  newEntries[idx] = newContent
  setEntries(target, newEntries)
  await persist()
  return successResponse(target, 'Entry replaced.')
}

/**
 * Remove an entry containing oldText substring.
 */
export async function removeEntry(target: MemoryTarget, oldText: string): Promise<MemoryResult> {
  oldText = oldText.trim()
  if (!oldText) return { success: false, error: 'oldText cannot be empty.' }

  const entries = entriesFor(target)
  const matches = entries
    .map((e, i) => ({ entry: e, index: i }))
    .filter(({ entry }) => entry.includes(oldText))

  if (!matches.length) {
    return { success: false, error: `No entry matched '${oldText}'.` }
  }

  if (matches.length > 1) {
    const uniqueTexts = new Set(matches.map(m => m.entry))
    if (uniqueTexts.size > 1) {
      return {
        success: false,
        error: `Multiple entries matched '${oldText}'. Be more specific.`,
        matches: matches.map(m => m.entry.slice(0, 80) + (m.entry.length > 80 ? '...' : '')),
      }
    }
  }

  const newEntries = entries.filter((_, i) => i !== matches[0].index)
  setEntries(target, newEntries)
  await persist()
  return successResponse(target, 'Entry removed.')
}

/**
 * Get all entries for a target (live state, for UI).
 */
export function getEntries(target: MemoryTarget): string[] {
  return [...entriesFor(target)]
}

/**
 * Get usage info for a target.
 */
export function getUsage(target: MemoryTarget): { current: number; limit: number; pct: number } {
  const current = charCount(target)
  const limit = CHAR_LIMITS[target]
  return { current, limit, pct: Math.min(100, Math.round((current / limit) * 100)) }
}

/**
 * Overwrite all entries for a target (used by bulk edit in UI).
 * Returns false if the entries exceed the character limit.
 */
export async function setAllEntries(target: MemoryTarget, entries: string[]): Promise<boolean> {
  const filtered = entries.filter(e => e.trim())
  const limit = CHAR_LIMITS[target]
  const total = filtered.join(ENTRY_DELIMITER).length

  if (total > limit) return false

  setEntries(target, filtered)
  await persist()
  return true
}

/**
 * Overwrite all user fields (used by UI).
 */
export async function setAllUserFields(fields: UserFields): Promise<void> {
  _userFields = { ...fields }
  await persist()
}

/**
 * Compact entries using LLM — merge duplicates, remove stale info, shorten verbose entries.
 * Returns the compacted entries, or null if compaction failed.
 */
export async function compactEntries(
  target: MemoryTarget,
  config: { endpoint: string; apiKey: string; model: string },
): Promise<string[] | null> {
  const entries = entriesFor(target)
  if (entries.length < 2) return null

  const { createProvider } = await import('../core/agent/provider')

  const prompt = target === 'user'
    ? `You are a memory compaction system. Consolidate these user profile entries into a shorter, deduplicated version.

Rules:
- Merge entries that say the same thing differently
- Remove outdated or contradictory info (keep the latest)
- Keep ALL unique facts — don't lose information
- Shorten verbose entries without losing meaning
- Keep entries as separate items, delimited by §

Return ONLY the compacted entries, one per line, separated by § (section sign).
Do NOT include headers, explanations, or labels.`
    : `You are a memory compaction system. Consolidate these personal notes into a shorter, deduplicated version.

Rules:
- Merge entries that say the same thing differently
- Remove outdated or contradictory info (keep the latest)
- Keep ALL unique facts — don't lose information
- Shorten verbose entries without losing meaning
- Keep entries as separate items, delimited by §

Return ONLY the compacted entries, one per line, separated by § (section sign).
Do NOT include headers, explanations, or labels.`

  const provider = createProvider(config)
  const messages = [
    { role: 'system' as const, content: prompt },
    { role: 'user' as const, content: entries.join('\n§\n') },
  ]

  let responseText = ''
  try {
    await provider.streamChat(
      messages,
      [],
      (text) => { responseText += text },
      () => {},
    )
  } catch {
    return null
  }

  // Parse response — split by §
  const compacted = responseText
    .split('§')
    .map(e => e.trim())
    .filter(e => e.length > 0)

  if (compacted.length === 0) return null

  // Enforce character limit
  const limit = CHAR_LIMITS[target]
  const total = compacted.join(ENTRY_DELIMITER).length
  if (total > limit) {
    // Truncate entries to fit
    const result: string[] = []
    let running = 0
    for (const entry of compacted) {
      const cost = entry.length + (result.length > 0 ? ENTRY_DELIMITER.length : 0)
      if (running + cost > limit) break
      result.push(entry)
      running += cost
    }
    if (result.length === 0) return null
    setEntries(target, result)
  } else {
    setEntries(target, compacted)
  }

  await persist()
  return entriesFor(target)
}

// ── Helpers ──

function successResponse(target: MemoryTarget, message?: string): MemoryResult {
  const entries = entriesFor(target)
  const { current, limit, pct } = getUsage(target)
  const hint = pct >= 80
    ? `\n⚠️ Memory ${pct}% full. Consider calling update_memory(action="compact", target="${target}") to consolidate.`
    : ''
  return {
    success: true,
    target,
    entries,
    usage: `${pct}% — ${current.toLocaleString()}/${limit.toLocaleString()} chars`,
    entryCount: entries.length,
    message: (message || '') + hint,
  }
}
