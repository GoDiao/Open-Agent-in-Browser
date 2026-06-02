import type { ChatMessage } from '../core/types'

export interface ScheduledTask {
  id: string
  name: string
  prompt: string
  schedule: {
    type: 'once' | 'interval' | 'daily'
    // For 'once': timestamp in ms
    // For 'interval': minutes between runs
    // For 'daily': { hour, minute }
    value: number | { hour: number; minute: number }
  }
  enabled: boolean
  lastRun?: number
  nextRun?: number
  createdAt: number
}

const STORAGE_KEY = 'scheduledTasks'

function generateId(): string {
  return 'task_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export async function getScheduledTasks(): Promise<ScheduledTask[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as ScheduledTask[] | undefined) || []
}

export async function saveScheduledTask(task: Omit<ScheduledTask, 'id' | 'createdAt'>): Promise<ScheduledTask> {
  const tasks = await getScheduledTasks()
  const fullTask: ScheduledTask = {
    ...task,
    id: generateId(),
    createdAt: Date.now(),
  }
  tasks.push(fullTask)
  await chrome.storage.local.set({ [STORAGE_KEY]: tasks })
  await syncAlarms()
  return fullTask
}

export async function updateScheduledTask(id: string, updates: Partial<ScheduledTask>): Promise<void> {
  const tasks = await getScheduledTasks()
  const index = tasks.findIndex(t => t.id === id)
  if (index >= 0) {
    tasks[index] = { ...tasks[index], ...updates }
    await chrome.storage.local.set({ [STORAGE_KEY]: tasks })
    await syncAlarms()
  }
}

export async function deleteScheduledTask(id: string): Promise<void> {
  const tasks = await getScheduledTasks()
  await chrome.storage.local.set({
    [STORAGE_KEY]: tasks.filter(t => t.id !== id),
  })
  await chrome.alarms.clear(id)
}

function calculateNextRun(task: ScheduledTask): number {
  const now = Date.now()

  switch (task.schedule.type) {
    case 'once':
      return task.schedule.value as number
    case 'interval': {
      const minutes = task.schedule.value as number
      return now + minutes * 60 * 1000
    }
    case 'daily': {
      const { hour, minute } = task.schedule.value as { hour: number; minute: number }
      const next = new Date()
      next.setHours(hour, minute, 0, 0)
      if (next.getTime() <= now) {
        next.setDate(next.getDate() + 1)
      }
      return next.getTime()
    }
  }
}

export async function syncAlarms(): Promise<void> {
  const tasks = await getScheduledTasks()

  // Clear all existing alarms
  await chrome.alarms.clearAll()

  // Create alarms for enabled tasks
  for (const task of tasks) {
    if (!task.enabled) continue

    const nextRun = calculateNextRun(task)

    // Update nextRun in storage
    await updateScheduledTask(task.id, { nextRun })

    if (task.schedule.type === 'interval') {
      chrome.alarms.create(task.id, {
        periodInMinutes: task.schedule.value as number,
      })
    } else {
      chrome.alarms.create(task.id, {
        when: nextRun,
      })
    }
  }
}

export function formatSchedule(schedule: ScheduledTask['schedule']): string {
  switch (schedule.type) {
    case 'once':
      return new Date(schedule.value as number).toLocaleString()
    case 'interval':
      return `Every ${schedule.value} minutes`
    case 'daily': {
      const { hour, minute } = schedule.value as { hour: number; minute: number }
      return `Daily at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }
  }
}

export function formatNextRun(timestamp?: number): string {
  if (!timestamp) return 'Not scheduled'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = timestamp - now.getTime()

  if (diff < 0) return 'Overdue'
  if (diff < 60000) return 'In less than a minute'
  if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`
  if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`
  return date.toLocaleString()
}
