/**
 * SoulStore — AI personality and behavior configuration.
 *
 * Defines how the assistant behaves: personality, communication style,
 * boundaries, and preferences. Separated from memory (user facts).
 */

const STORAGE_KEY = 'soulStore'

export interface SoulData {
  personality: string
  communicationStyle: string
  boundaries: string[]
  preferences: string[]
}

const DEFAULT_SOUL: SoulData = {
  personality: 'Helpful, direct, competent. Have opinions when asked.',
  communicationStyle: 'Concise. Use bullet points for lists. Keep responses short and data-rich.',
  boundaries: [],
  preferences: []
}

const MAX_FIELD_LENGTH = 500
const MAX_ITEMS = 20

// ── Lazy load ──

let _loaded = false
let _soul: SoulData = { ...DEFAULT_SOUL }

async function ensureLoaded(): Promise<void> {
  if (_loaded) return
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const data = result[STORAGE_KEY] as SoulData | undefined
  _soul = data ? { ...DEFAULT_SOUL, ...data } : { ...DEFAULT_SOUL }
  _loaded = true
}

// ── Frozen snapshot ──

let _frozenSnapshot: SoulData = { ...DEFAULT_SOUL }

export async function loadSoul(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const data = result[STORAGE_KEY] as SoulData | undefined
  _soul = data ? { ...DEFAULT_SOUL, ...data } : { ...DEFAULT_SOUL }
  _loaded = true
  _frozenSnapshot = { ..._soul }
}

export function getSoulSnapshot(): SoulData {
  return { ..._frozenSnapshot }
}

// ── Persistence ──

async function persist(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: _soul,
  })
}

// ── Public API ──

export interface SoulResult {
  success: boolean
  message?: string
  error?: string
  data?: SoulData
}

/**
 * Get current soul data.
 */
export function getSoul(): SoulData {
  return { ..._soul }
}

/**
 * Update soul data fields.
 */
export async function updateSoul(updates: Partial<SoulData>): Promise<SoulResult> {
  await ensureLoaded()

  if (updates.personality !== undefined) {
    if (updates.personality.length > MAX_FIELD_LENGTH) {
      return { success: false, error: `Personality too long (max ${MAX_FIELD_LENGTH} chars)` }
    }
    _soul.personality = updates.personality.trim()
  }

  if (updates.communicationStyle !== undefined) {
    if (updates.communicationStyle.length > MAX_FIELD_LENGTH) {
      return { success: false, error: `Communication style too long (max ${MAX_FIELD_LENGTH} chars)` }
    }
    _soul.communicationStyle = updates.communicationStyle.trim()
  }

  if (updates.boundaries !== undefined) {
    if (updates.boundaries.length > MAX_ITEMS) {
      return { success: false, error: `Too many boundaries (max ${MAX_ITEMS})` }
    }
    _soul.boundaries = updates.boundaries.map(b => b.trim()).filter(Boolean)
  }

  if (updates.preferences !== undefined) {
    if (updates.preferences.length > MAX_ITEMS) {
      return { success: false, error: `Too many preferences (max ${MAX_ITEMS})` }
    }
    _soul.preferences = updates.preferences.map(p => p.trim()).filter(Boolean)
  }

  await persist()
  return { success: true, message: 'Soul updated.', data: { ..._soul } }
}

/**
 * Reset to default soul.
 */
export async function resetSoul(): Promise<SoulResult> {
  await ensureLoaded()
  _soul = { ...DEFAULT_SOUL }
  await persist()
  return { success: true, message: 'Soul reset to default.', data: { ..._soul } }
}

/**
 * Render soul as prompt section.
 */
export function renderSoulPrompt(): string {
  const lines: string[] = []

  if (_soul.personality) {
    lines.push(`## Personality\n${_soul.personality}`)
  }

  if (_soul.communicationStyle) {
    lines.push(`## Communication Style\n${_soul.communicationStyle}`)
  }

  if (_soul.boundaries.length > 0) {
    lines.push(`## Boundaries\n- ${_soul.boundaries.join('\n- ')}`)
  }

  if (_soul.preferences.length > 0) {
    lines.push(`## Preferences\n- ${_soul.preferences.join('\n- ')}`)
  }

  if (lines.length === 0) return ''

  return `<soul>\n${lines.join('\n\n')}\n</soul>`
}