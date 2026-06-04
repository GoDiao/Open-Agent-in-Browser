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

// Import after setting up mocks
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadMemory,
  addEntry,
  replaceEntry,
  removeEntry,
  getEntries,
  getUsage,
  getUserFields,
  setAllEntries,
  setAllUserFields,
  type MemoryTarget,
} from '../lib/memory'

describe('Memory Store', () => {
  beforeEach(async () => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    // Reset memory module state by reloading
    await loadMemory()
  })

  describe('addEntry', () => {
    it('should add entry to memory store', async () => {
      await addEntry('memory', 'Test entry')
      const entries = getEntries('memory')
      expect(entries).toContain('Test entry')
    })

    it('should add entry to user store', async () => {
      await addEntry('user', 'User note')
      const entries = getEntries('user')
      expect(entries).toContain('User note')
    })

    it('should deduplicate entries', async () => {
      await addEntry('memory', 'Duplicate')
      await addEntry('memory', 'Duplicate')
      const entries = getEntries('memory')
      expect(entries.filter(e => e === 'Duplicate').length).toBe(1)
    })
  })

  describe('replaceEntry', () => {
    it('should replace existing entry', async () => {
      await addEntry('memory', 'Old text')
      await replaceEntry('memory', 'Old text', 'New text')
      const entries = getEntries('memory')
      expect(entries).toContain('New text')
      expect(entries).not.toContain('Old text')
    })

    it('should return success for existing entry', async () => {
      await addEntry('memory', 'Test')
      const result = await replaceEntry('memory', 'Test', 'Replaced')
      expect(result.success).toBe(true)
    })

    it('should return error for non-existent entry', async () => {
      const result = await replaceEntry('memory', 'Non-existent', 'New')
      expect(result.success).toBe(false)
    })
  })

  describe('removeEntry', () => {
    it('should remove existing entry', async () => {
      await addEntry('memory', 'To remove')
      await removeEntry('memory', 'To remove')
      const entries = getEntries('memory')
      expect(entries).not.toContain('To remove')
    })

    it('should return success for existing entry', async () => {
      await addEntry('memory', 'Test')
      const result = await removeEntry('memory', 'Test')
      expect(result.success).toBe(true)
    })
  })

  describe('getEntries', () => {
    it('should return empty array for empty store', () => {
      const entries = getEntries('memory')
      expect(entries).toEqual([])
    })

    it('should return all entries', async () => {
      await addEntry('memory', 'Entry 1')
      await addEntry('memory', 'Entry 2')
      const entries = getEntries('memory')
      expect(entries).toHaveLength(2)
    })
  })

  describe('getUsage', () => {
    it('should return correct usage stats', async () => {
      await addEntry('memory', 'Some content here')
      const usage = getUsage('memory')
      expect(usage.current).toBeGreaterThan(0)
      expect(usage.limit).toBe(8000)
      // pct may be 0 if content is very short
      expect(usage.pct).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getUserFields', () => {
    it('should return empty fields by default', () => {
      const fields = getUserFields()
      expect(fields.name).toBe('')
      expect(fields.email).toBe('')
      expect(fields.role).toBe('')
    })
  })

  describe('setAllEntries', () => {
    it('should replace all entries', async () => {
      await addEntry('memory', 'Old')
      await setAllEntries('memory', ['New 1', 'New 2'])
      const entries = getEntries('memory')
      expect(entries).toEqual(['New 1', 'New 2'])
    })
  })

  describe('setAllUserFields', () => {
    it('should update user fields', async () => {
      await setAllUserFields({
        name: 'Test User',
        nickname: 'tester',
        email: 'test@example.com',
        timezone: 'UTC',
        language: 'en',
        role: 'developer',
      })
      const fields = getUserFields()
      expect(fields.name).toBe('Test User')
      expect(fields.email).toBe('test@example.com')
    })
  })
})