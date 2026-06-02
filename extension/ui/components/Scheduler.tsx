import { useEffect, useState } from 'react'
import { ArrowLeftIcon, TrashIcon, PlusIcon, ClockIcon, PlayIcon, PauseIcon } from 'lucide-react'
import type { ScheduledTask } from '../../lib/scheduler'
import {
  getScheduledTasks,
  saveScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  formatSchedule,
  formatNextRun,
} from '../../lib/scheduler'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
}

export function Scheduler({ onClose }: Props) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState({
    name: '',
    prompt: '',
    type: 'interval' as 'once' | 'interval' | 'daily',
    intervalMinutes: 60,
    dailyHour: 9,
    dailyMinute: 0,
    onceDate: '',
    onceTime: '09:00',
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    const data = await getScheduledTasks()
    setTasks(data)
  }

  const handleCreate = async () => {
    if (!newTask.name || !newTask.prompt) return

    let schedule: ScheduledTask['schedule']
    switch (newTask.type) {
      case 'once': {
        const dateTime = new Date(`${newTask.onceDate}T${newTask.onceTime}`)
        schedule = { type: 'once', value: dateTime.getTime() }
        break
      }
      case 'interval':
        schedule = { type: 'interval', value: newTask.intervalMinutes }
        break
      case 'daily':
        schedule = { type: 'daily', value: { hour: newTask.dailyHour, minute: newTask.dailyMinute } }
        break
    }

    await saveScheduledTask({
      name: newTask.name,
      prompt: newTask.prompt,
      schedule,
      enabled: true,
    })

    setShowCreate(false)
    setNewTask({
      name: '',
      prompt: '',
      type: 'interval',
      intervalMinutes: 60,
      dailyHour: 9,
      dailyMinute: 0,
      onceDate: '',
      onceTime: '09:00',
    })
    loadTasks()
  }

  const handleToggle = async (task: ScheduledTask) => {
    await updateScheduledTask(task.id, { enabled: !task.enabled })
    loadTasks()
  }

  const handleDelete = async (id: string) => {
    await deleteScheduledTask(id)
    loadTasks()
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/90">
            Scheduled Tasks
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {tasks.length} tasks
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors duration-150"
          title="Create task"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {showCreate ? (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
              New Task
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Name</label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="Daily check"
                className="w-full border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Prompt</label>
              <textarea
                value={newTask.prompt}
                onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                placeholder="What should Iris do?"
                rows={3}
                className="w-full border border-border/40 bg-transparent px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Schedule</label>
              <div className="flex gap-1.5">
                {(['once', 'interval', 'daily'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewTask({ ...newTask, type })}
                    className={cn(
                      'px-2.5 py-1.5 text-[11px] font-mono border transition-all',
                      newTask.type === type
                        ? 'border-primary/40 bg-primary/[0.06] text-foreground'
                        : 'border-border/40 text-muted-foreground/60 hover:border-primary/20',
                    )}
                  >
                    {type === 'once' ? 'Once' : type === 'interval' ? 'Interval' : 'Daily'}
                  </button>
                ))}
              </div>

              {newTask.type === 'once' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTask.onceDate}
                    onChange={(e) => setNewTask({ ...newTask, onceDate: e.target.value })}
                    className="flex-1 border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none"
                  />
                  <input
                    type="time"
                    value={newTask.onceTime}
                    onChange={(e) => setNewTask({ ...newTask, onceTime: e.target.value })}
                    className="border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none"
                  />
                </div>
              )}

              {newTask.type === 'interval' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newTask.intervalMinutes}
                    onChange={(e) => setNewTask({ ...newTask, intervalMinutes: parseInt(e.target.value) || 60 })}
                    min={1}
                    className="w-20 border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none text-center"
                  />
                  <span className="text-[11px] text-muted-foreground/50">minutes</span>
                </div>
              )}

              {newTask.type === 'daily' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/50">At</span>
                  <input
                    type="number"
                    value={newTask.dailyHour}
                    onChange={(e) => setNewTask({ ...newTask, dailyHour: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={23}
                    className="w-12 border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none text-center"
                  />
                  <span className="text-[11px] text-muted-foreground/50">:</span>
                  <input
                    type="number"
                    value={newTask.dailyMinute}
                    onChange={(e) => setNewTask({ ...newTask, dailyMinute: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={59}
                    className="w-12 border-b border-border/40 bg-transparent px-0 py-1.5 text-[13px] text-foreground outline-none text-center"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTask.name || !newTask.prompt}
                className={cn(
                  'flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-all',
                  newTask.name && newTask.prompt
                    ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20'
                    : 'text-muted-foreground/40 border border-border/30 cursor-not-allowed',
                )}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60 border border-border/40 hover:bg-muted/30"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <ClockIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40">No scheduled tasks</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-[11px] text-primary/60 hover:text-primary"
              >
                Create your first task
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'border border-border/40 p-3 transition-all',
                  !task.enabled && 'opacity-50',
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-medium text-foreground/85">{task.name}</p>
                    <p className="text-[10px] text-muted-foreground/50 font-mono">
                      {formatSchedule(task.schedule)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(task)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center transition-colors',
                        task.enabled ? 'text-primary/60 hover:text-primary' : 'text-muted-foreground/40 hover:text-foreground',
                      )}
                      title={task.enabled ? 'Disable' : 'Enable'}
                    >
                      {task.enabled ? (
                        <PauseIcon className="h-3 w-3" />
                      ) : (
                        <PlayIcon className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground/30 hover:text-destructive/70 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 line-clamp-2 mb-2">
                  {task.prompt}
                </p>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground/40">
                  <span>Next: {formatNextRun(task.nextRun)}</span>
                  {task.lastRun && (
                    <span>Last: {new Date(task.lastRun).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
