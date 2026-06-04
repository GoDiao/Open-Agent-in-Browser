/**
 * Import — data import for Iris.
 *
 * Supports importing exported JSON data with merge/replace options.
 */

import type { StorageConfig } from '../core/types'
import type { SoulData } from './soul'
import type { Conversation } from '../core/types'
import { setConfig } from './storage'
import { updateSoul } from './soul'
import { setAllEntries, setAllUserFields, type UserFields } from './memory'
import { saveConversation } from './storage'
import type { ExportData } from './export'

export interface ImportResult {
  success: boolean
  message: string
  imported: {
    memory?: boolean
    soul?: boolean
    conversations?: number
    settings?: boolean
  }
}

const CURRENT_VERSION = '0.1.0'

/**
 * Validate import data structure.
 */
export function validateImportData(json: string): { valid: boolean; data?: ExportData; error?: string } {
  try {
    const data = JSON.parse(json) as ExportData

    if (!data.version || !data.data) {
      return { valid: false, error: 'Invalid export format: missing version or data' }
    }

    // Check version compatibility (allow minor version differences)
    const [major, minor] = CURRENT_VERSION.split('.').map(Number)
    const [expMajor] = data.version.split('.').map(Number)

    if (expMajor > major) {
      return { valid: false, error: `Incompatible version: ${data.version}` }
    }

    return { valid: true, data }
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' }
  }
}

/**
 * Import data with specified merge strategy.
 * @param json - The JSON string to import
 * @param strategy - 'merge' (keep existing) or 'replace' (overwrite)
 */
export async function importData(json: string, strategy: 'merge' | 'replace' = 'merge'): Promise<ImportResult> {
  const validation = validateImportData(json)
  if (!validation.valid || !validation.data) {
    return { success: false, message: validation.error || 'Unknown error', imported: {} }
  }

  const data = validation.data
  const imported: ImportResult['imported'] = {}

  try {
    // Import memory
    if (data.data.memory) {
      if (strategy === 'replace') {
        await setAllEntries('user', data.data.memory.user.split('\n§\n').filter(Boolean))
        await setAllEntries('memory', data.data.memory.memory.split('\n§\n').filter(Boolean))
      }
      if (data.data.memory.userFields) {
        await setAllUserFields(data.data.memory.userFields as UserFields)
      }
      imported.memory = true
    }

    // Import soul
    if (data.data.soul) {
      if (strategy === 'replace') {
        await updateSoul(data.data.soul)
      }
      imported.soul = true
    }

    // Import conversations
    if (data.data.conversations && data.data.conversations.length > 0) {
      for (const conv of data.data.conversations) {
        await saveConversation(conv)
      }
      imported.conversations = data.data.conversations.length
    }

    // Import settings
    if (data.data.settings) {
      if (strategy === 'replace') {
        // Don't overwrite apiKey for security
        const existingConfig = data.data.settings
        const newConfig: StorageConfig = {
          ...existingConfig,
          apiKey: existingConfig.apiKey || '',
        }
        await setConfig(newConfig)
      }
      imported.settings = true
    }

    return {
      success: true,
      message: `Imported ${Object.entries(imported).filter(([, v]) => v).length} categories`,
      imported,
    }
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Import failed',
      imported,
    }
  }
}

/**
 * Read import file from input element.
 */
export async function readImportFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}