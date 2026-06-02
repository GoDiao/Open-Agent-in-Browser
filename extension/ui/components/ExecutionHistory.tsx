import { useEffect, useState } from 'react'
import { ArrowLeftIcon, TrashIcon, SearchIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import type { ExecutionRecord } from '../../lib/history'
import { getExecutionHistory, clearExecutionHistory, searchExecutionHistory } from '../../lib/history'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncateArgs(args: string, maxLen = 80): string {
  if (args.length <= maxLen) return args
  return args.slice(0, maxLen) + '...'
}

export function ExecutionHistory({ onClose }: Props) {
  const [records, setRecords] = useState<ExecutionRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<ExecutionRecord | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const data = await getExecutionHistory()
    setRecords(data)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory()
      return
    }
    const results = await searchExecutionHistory(searchQuery)
    setRecords(results)
  }

  const handleClear = async () => {
    await clearExecutionHistory()
    setRecords([])
    setSelectedRecord(null)
  }

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
            Execution History
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {records.length} records
          </span>
        </div>
        <button
          onClick={handleClear}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground/40 hover:text-destructive/70 transition-colors duration-150"
          title="Clear history"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-border/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, args, URLs..."
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          selectedRecord && "hidden md:block md:w-1/2"
        )}>
          {records.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-muted-foreground/40">No execution records</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {records.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 hover:bg-muted/30 transition-colors",
                    selectedRecord?.id === record.id && "bg-primary/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {record.result.isError ? (
                      <XCircleIcon className="h-3 w-3 text-destructive/60 shrink-0" />
                    ) : (
                      <CheckCircleIcon className="h-3 w-3 text-green-500/60 shrink-0" />
                    )}
                    <span className="text-[11px] font-mono font-medium text-foreground/85">
                      {record.toolName}
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/40 ml-auto">
                      <ClockIcon className="h-2.5 w-2.5" />
                      {formatDuration(record.duration)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 font-mono truncate pl-5">
                    {truncateArgs(record.args)}
                  </p>
                  <p className="text-[9px] text-muted-foreground/35 pl-5 mt-0.5">
                    {formatTime(record.timestamp)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        {selectedRecord && (
          <div className="flex-1 md:w-1/2 overflow-y-auto border-l border-border/40">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-foreground/90">
                  {selectedRecord.toolName}
                </span>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-[10px] text-muted-foreground/50 hover:text-foreground md:hidden"
                >
                  Back
                </button>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-[10px] text-muted-foreground/50">
                <p>Duration: {formatDuration(selectedRecord.duration)}</p>
                <p>Time: {formatTime(selectedRecord.timestamp)}</p>
                {selectedRecord.tabId && <p>Tab: {selectedRecord.tabId}</p>}
                {selectedRecord.pageUrl && (
                  <p className="truncate">URL: {selectedRecord.pageUrl}</p>
                )}
              </div>

              {/* Args */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/40">
                  Arguments
                </label>
                <pre className="text-[11px] font-mono text-foreground/80 bg-muted/30 p-2 rounded overflow-x-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedRecord.args), null, 2)
                    } catch {
                      return selectedRecord.args
                    }
                  })()}
                </pre>
              </div>

              {/* Result */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/40">
                  Result
                </label>
                <div className={cn(
                  "text-[11px] font-mono p-2 rounded overflow-x-auto",
                  selectedRecord.result.isError
                    ? "bg-destructive/5 text-destructive/80"
                    : "bg-muted/30 text-foreground/80"
                )}>
                  {selectedRecord.result.content.map((item, i) => (
                    <div key={i}>
                      {item.type === 'text' ? (
                        <pre className="whitespace-pre-wrap">{item.text}</pre>
                      ) : (
                        <span className="text-muted-foreground/50">[Image: {item.mimeType}]</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
