import { useState } from 'react'
import {
  SettingsIcon,
  PanelRightOpenIcon,
  CameraIcon,
  FileTextIcon,
  SendIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'

export function PopupApp() {
  const [inputValue, setInputValue] = useState('')

  const openSidePanelWithMessage = (message?: string) => {
    chrome.runtime.sendMessage({
      type: 'open-sidepanel',
      ...(message ? { message } : {}),
    })
    window.close()
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    openSidePanelWithMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
    window.close()
  }

  return (
    <div className="w-80 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-orange/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">Open Agent</span>
        </div>
        <button
          onClick={openOptions}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
          title="Settings"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Input */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 focus-within:border-ring transition-colors duration-200">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150',
              inputValue.trim()
                ? 'text-primary hover:bg-primary/10'
                : 'text-muted-foreground/40 cursor-not-allowed',
            )}
          >
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        <button
          onClick={() => openSidePanelWithMessage()}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-accent/50 hover:border-primary/30 transition-all duration-150"
        >
          <PanelRightOpenIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Open Sidepanel</p>
            <p className="text-[11px] text-muted-foreground">Full chat interface</p>
          </div>
        </button>

        <button
          onClick={() => openSidePanelWithMessage('Take a screenshot of this page')}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-accent/50 hover:border-primary/30 transition-all duration-150"
        >
          <CameraIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Screenshot this page</p>
            <p className="text-[11px] text-muted-foreground">Capture and analyze</p>
          </div>
        </button>

        <button
          onClick={() => openSidePanelWithMessage('Summarize this page')}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-accent/50 hover:border-primary/30 transition-all duration-150"
        >
          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Summarize this page</p>
            <p className="text-[11px] text-muted-foreground">Get a quick summary</p>
          </div>
        </button>
      </div>
    </div>
  )
}
