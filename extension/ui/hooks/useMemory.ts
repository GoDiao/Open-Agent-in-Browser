import { useCallback, useEffect, useState } from 'react'
import type { MemoryTarget, UserFields } from '../../lib/memory'
import { getEntries, getUsage, getUserFields, setAllEntries, setAllUserFields } from '../../lib/memory'

export interface MemoryInfo {
  entries: string[]
  usage: { current: number; limit: number; pct: number }
  userFields: UserFields
}

export function useMemory(target: MemoryTarget) {
  const [info, setInfo] = useState<MemoryInfo>({
    entries: [],
    usage: { current: 0, limit: 0, pct: 0 },
    userFields: { name: '', nickname: '', email: '', timezone: '', language: '', role: '' },
  })

  const refresh = useCallback(() => {
    const entries = getEntries(target)
    const usage = getUsage(target)
    const userFields = getUserFields()
    setInfo({ entries, usage, userFields })
  }, [target])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (entries: string[]): Promise<boolean> => {
    const ok = await setAllEntries(target, entries)
    if (ok) refresh()
    return ok
  }, [target, refresh])

  const saveFields = useCallback(async (fields: UserFields) => {
    await setAllUserFields(fields)
    refresh()
  }, [refresh])

  return { ...info, refresh, save, saveFields }
}
