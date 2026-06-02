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
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-primary/80">Iris</span>
        </div>
        <button
          onClick={openOptions}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors duration-150"
          title="Settings"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Input */}
      <div className="px-4 pt-2.5 pb-2">
        <div className="flex items-center gap-2 border-b border-border/40 px-0 py-1.5 focus-within:border-primary/40 transition-colors duration-200">
          <span className="text-primary/60 select-none text-[11px]">▸</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'flex h-5 w-5 items-center justify-center transition-all duration-150',
              inputValue.trim()
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground/30 cursor-not-allowed',
            )}
          >
            <SendIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-3 space-y-0">
        <button
          onClick={() => openSidePanelWithMessage()}
          className="flex w-full items-center gap-2.5 border-b border-border/30 px-0 py-2 text-left hover:bg-muted/40 transition-colors duration-150"
        >
          <PanelRightOpenIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
          <div>
            <p className="text-[12px] font-medium text-foreground/90">Open Sidepanel</p>
            <p className="text-[10px] text-muted-foreground/50">Full chat interface</p>
          </div>
        </button>

        <button
          onClick={() => openSidePanelWithMessage('Take a screenshot of this page')}
          className="flex w-full items-center gap-2.5 border-b border-border/30 px-0 py-2 text-left hover:bg-muted/40 transition-colors duration-150"
        >
          <CameraIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
          <div>
            <p className="text-[12px] font-medium text-foreground/90">Screenshot</p>
            <p className="text-[10px] text-muted-foreground/50">Capture current page</p>
          </div>
        </button>

        <button
          onClick={() => openSidePanelWithMessage('Summarize this page')}
          className="flex w-full items-center gap-2.5 px-0 py-2 text-left hover:bg-muted/40 transition-colors duration-150"
        >
          <FileTextIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
          <div>
            <p className="text-[12px] font-medium text-foreground/90">Summarize</p>
            <p className="text-[10px] text-muted-foreground/50">Quick page summary</p>
          </div>
        </button>
      </div>
    </div>
  )
}
