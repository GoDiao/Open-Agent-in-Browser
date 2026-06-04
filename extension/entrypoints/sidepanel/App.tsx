import { useEffect, useState } from 'react'
import { ChatLayout } from '../../ui/components/ChatLayout'
import { Settings } from '../../ui/components/Settings'
import { Onboarding } from '../../ui/components/Onboarding'
import { ExecutionHistory } from '../../ui/components/ExecutionHistory'
import { Scheduler } from '../../ui/components/Scheduler'
import { AgentProfiles } from '../../ui/components/AgentProfiles'
import { ConversationList } from '../../ui/components/ConversationList'
import { MemoryPanel } from '../../ui/components/MemoryPanel'
import { SoulPanel } from '../../ui/components/SoulPanel'
import { ToastProvider } from '../../ui/components/Toast'
import { useChat } from '../../ui/hooks/useChat'
import { getTheme, applyTheme, getConfig } from '../../lib/storage'
import { loadMemory } from '../../lib/memory'
import { loadSoul } from '../../lib/soul'

export function App() {
  const [view, setView] = useState<'chat' | 'settings' | 'onboarding' | 'history' | 'scheduler' | 'profiles' | 'conversations' | 'memory' | 'soul'>('chat')
  const {
    messages,
    isStreaming,
    currentToolCall,
    error,
    sendMessage,
    stop,
    clear,
    loadConversation,
    handleBackgroundMessage,
  } = useChat()

  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const [memoryLoaded, setMemoryLoaded] = useState(false)

  // Apply theme on mount, load memory, check onboarding, and handle pending actions
  useEffect(() => {
    getTheme().then(applyTheme)
    loadMemory().then(() => loadSoul()).then(() => setMemoryLoaded(true))
    getConfig().then((config) => {
      if (!config.apiKey && config.provider !== 'ollama') {
        setView('onboarding')
      }
    })

    // Check for pending sidepanel action (from New Tab, etc.)
    chrome.storage.session.get('pendingSidepanelAction').then((result) => {
      const action = result.pendingSidepanelAction as { message?: string; conversationId?: string; timestamp?: number } | undefined
      if (action && action.timestamp && Date.now() - action.timestamp < 5000) {
        if (action.conversationId) {
          loadConversation(action.conversationId)
        } else if (action.message) {
          setPendingMessage(action.message)
        }
        chrome.storage.session.remove('pendingSidepanelAction')
      }
    })
  }, [])

  // Send pending message once sendMessage is ready
  useEffect(() => {
    if (pendingMessage && !isStreaming) {
      sendMessage(pendingMessage)
      setPendingMessage(null)
    }
  }, [pendingMessage, isStreaming, sendMessage])

  useEffect(() => {
    const listener = (msg: { type: string; [key: string]: unknown }) => {
      handleBackgroundMessage(msg)
      // Handle incoming messages from new tab / popup while sidepanel is open
      if (msg.type === 'sidepanel:send' && typeof msg.message === 'string') {
        sendMessage(msg.message)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [handleBackgroundMessage, sendMessage])

  if (view === 'onboarding') {
    return <ToastProvider><Onboarding onComplete={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'settings') {
    return <ToastProvider><Settings onClose={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'history') {
    return <ToastProvider><ExecutionHistory onClose={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'scheduler') {
    return <ToastProvider><Scheduler onClose={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'profiles') {
    return <ToastProvider><AgentProfiles onClose={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'memory') {
    return <ToastProvider><MemoryPanel onClose={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'soul') {
    return <ToastProvider><SoulPanel onClose={() => setView('chat')} /></ToastProvider>
  }

  if (view === 'conversations') {
    return (
      <ToastProvider>
        <ConversationList
          onClose={() => setView('chat')}
          onSelect={(id) => {
            loadConversation(id)
            setView('chat')
          }}
        />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <ChatLayout
        messages={messages}
        isStreaming={isStreaming}
        currentToolCall={currentToolCall}
        error={error}
        onSend={sendMessage}
        onStop={stop}
        onClear={clear}
        onOpenSettings={() => setView('settings')}
        onOpenHistory={() => setView('history')}
        onOpenScheduler={() => setView('scheduler')}
        onOpenProfiles={() => setView('profiles')}
        onOpenConversations={() => setView('conversations')}
        onOpenMemory={() => setView('memory')}
        onOpenSoul={() => setView('soul')}
        memoryLoaded={memoryLoaded}
      />
    </ToastProvider>
  )
}
