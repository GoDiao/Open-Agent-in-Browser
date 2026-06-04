/**
 * Export — data export for Iris.
 *
 * Supports exporting memory, soul, conversations, and settings to JSON.
 */

import type { StorageConfig } from '../core/types'
import type { SoulData } from './soul'
import type { Conversation } from '../core/types'
import { getConfig, getConversations } from './storage'
import { getSoulSnapshot } from './soul'
import { getMemorySnapshot } from './memory'

export const EXPORT_VERSION = '0.1.0'

export interface ExportData {
  version: string
  exportedAt: string
  data: {
    memory: {
      user: string
      memory: string
      userFields: Record<string, string>
    }
    soul: SoulData
    conversations: Conversation[]
    settings: StorageConfig
  }
}

export type ExportTarget = 'all' | 'memory' | 'soul' | 'conversations' | 'settings'

/**
 * Export Iris data to JSON.
 */
export async function exportData(target: ExportTarget = 'all'): Promise<string> {
  const exportPayload: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      memory: {
        user: getMemorySnapshot().user,
        memory: getMemorySnapshot().memory,
        userFields: getMemorySnapshot().userFields,
      },
      soul: getSoulSnapshot(),
      conversations: [],
      settings: await getConfig(),
    },
  }

  if (target === 'all' || target === 'conversations') {
    exportPayload.data.conversations = await getConversations()
  }

  return JSON.stringify(exportPayload, null, 2)
}

/**
 * Download export data as a JSON file.
 */
export async function downloadExport(target: ExportTarget = 'all'): Promise<void> {
  const json = await exportData(target)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `iris-export-${target}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}