/**
 * Telemetry — anonymous event tracking for Iris.
 *
 * This module provides optional, privacy-respecting telemetry.
 * Events are opt-in and contain no personally identifiable information.
 */

const TELEMETRY_KEY = 'telemetryEnabled'
const STORAGE_KEY = 'telemetryStore'

export type TelemetryEventType =
  | 'agent_start'
  | 'agent_complete'
  | 'tool_call'
  | 'error'
  | 'settings_change'
  | 'memory_update'
  | 'soul_update'

export interface TelemetryEvent {
  type: TelemetryEventType
  timestamp: number
  data?: Record<string, unknown>
}

export interface TelemetryConfig {
  enabled: boolean
  events: TelemetryEvent[]
}

const MAX_EVENTS = 100

let _enabled = false
let _events: TelemetryEvent[] = []

/**
 * Check if telemetry is enabled.
 */
export async function loadTelemetry(): Promise<boolean> {
  const result = await chrome.storage.local.get(TELEMETRY_KEY)
  _enabled = result[TELEMETRY_KEY] === true
  return _enabled
}

/**
 * Get current telemetry state.
 */
export function isTelemetryEnabled(): boolean {
  return _enabled
}

/**
 * Enable or disable telemetry.
 */
export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
  _enabled = enabled
  await chrome.storage.local.set({ [TELEMETRY_KEY]: enabled })
}

/**
 * Track an anonymous event.
 * Only records if telemetry is enabled.
 */
export async function trackEvent(
  type: TelemetryEventType,
  data?: Record<string, unknown>
): Promise<void> {
  if (!_enabled) return

  const event: TelemetryEvent = {
    type,
    timestamp: Date.now(),
    // Only include non-sensitive data
    data: sanitizeData(data),
  }

  _events.push(event)

  // Keep only recent events
  if (_events.length > MAX_EVENTS) {
    _events = _events.slice(-MAX_EVENTS)
  }

  // Persist events
  await chrome.storage.local.set({
    [STORAGE_KEY]: _events,
  })
}

/**
 * Get all recorded events.
 */
export function getEvents(): TelemetryEvent[] {
  return [..._events]
}

/**
 * Clear all recorded events.
 */
export async function clearEvents(): Promise<void> {
  _events = []
  await chrome.storage.local.set({ [STORAGE_KEY]: _events })
}

/**
 * Remove all telemetry data (disable and clear).
 */
export async function resetTelemetry(): Promise<void> {
  _enabled = false
  _events = []
  await chrome.storage.local.set({
    [TELEMETRY_KEY]: false,
    [STORAGE_KEY]: [],
  })
}

/**
 * Sanitize data to remove potentially sensitive information.
 */
function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined

  const sanitized: Record<string, unknown> = {}
  const blockedKeys = [
    'apiKey',
    'api_key',
    'apikey',
    'password',
    'token',
    'secret',
    'content',
    'messages',
    'conversation',
    'history',
    'email',
    'name',
  ]

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (blockedKeys.some(blocked => lowerKey.includes(blocked))) {
      sanitized[key] = '[redacted]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = '[object]'
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}