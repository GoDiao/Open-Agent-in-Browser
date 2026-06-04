// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {}
globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        const result: Record<string, unknown> = {}
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) {
          result[key] = mockStorage[key]
        }
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      }),
      remove: vi.fn((keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) {
          delete mockStorage[key]
        }
        return Promise.resolve()
      }),
    },
  },
} as unknown as typeof chrome

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadSoul,
  getSoul,
  getSoulSnapshot,
  updateSoul,
  resetSoul,
  renderSoulPrompt,
  type SoulData,
} from '../lib/soul'

const DEFAULT_SOUL: SoulData = {
  personality: 'Helpful, direct, competent. Have opinions when asked.',
  communicationStyle: 'Concise. Use bullet points for lists. Keep responses short and data-rich.',
  boundaries: [],
  preferences: []
}

describe('Soul Store', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    await loadSoul()
  })

  describe('getSoul', () => {
    it('should return default soul config', () => {
      const soul = getSoul()
      expect(soul.personality).toBe(DEFAULT_SOUL.personality)
      expect(soul.communicationStyle).toBe(DEFAULT_SOUL.communicationStyle)
    })
  })

  describe('getSoulSnapshot', () => {
    it('should return a copy of soul config', () => {
      const snapshot = getSoulSnapshot()
      expect(snapshot).toEqual(DEFAULT_SOUL)
      // Ensure it's a copy, not reference
      snapshot.personality = 'Modified'
      expect(getSoulSnapshot().personality).toBe(DEFAULT_SOUL.personality)
    })
  })

  describe('updateSoul', () => {
    it('should update personality', async () => {
      const result = await updateSoul({ personality: 'New personality' })
      expect(result.success).toBe(true)
      expect(getSoul().personality).toBe('New personality')
    })

    it('should update communication style', async () => {
      const result = await updateSoul({ communicationStyle: 'New style' })
      expect(result.success).toBe(true)
      expect(getSoul().communicationStyle).toBe('New style')
    })

    it('should update boundaries', async () => {
      const result = await updateSoul({ boundaries: ['Boundary 1', 'Boundary 2'] })
      expect(result.success).toBe(true)
      expect(getSoul().boundaries).toEqual(['Boundary 1', 'Boundary 2'])
    })

    it('should update preferences', async () => {
      const result = await updateSoul({ preferences: ['Pref 1'] })
      expect(result.success).toBe(true)
      expect(getSoul().preferences).toEqual(['Pref 1'])
    })

    it('should handle partial updates', async () => {
      await updateSoul({ personality: 'Custom personality' })
      // communicationStyle should remain default
      expect(getSoul().communicationStyle).toBe(DEFAULT_SOUL.communicationStyle)
    })

    it('should reject overly long fields', async () => {
      const longString = 'x'.repeat(600) // MAX_FIELD_LENGTH is 500
      const result = await updateSoul({ personality: longString })
      expect(result.success).toBe(false)
    })
  })

  describe('resetSoul', () => {
    it('should reset to defaults', async () => {
      await updateSoul({
        personality: 'Custom',
        boundaries: ['Custom boundary']
      })
      const result = await resetSoul()
      expect(result.success).toBe(true)
      expect(getSoul()).toEqual(DEFAULT_SOUL)
    })
  })

  describe('renderSoulPrompt', () => {
    it('should render default soul', () => {
      const prompt = renderSoulPrompt()
      expect(prompt).toContain('<soul>')
      expect(prompt).toContain('Personality')
      expect(prompt).toContain('Communication Style')
    })

    it('should include custom values', async () => {
      await updateSoul({ personality: 'Custom personality' })
      const prompt = renderSoulPrompt()
      expect(prompt).toContain('Custom personality')
    })
  })
})