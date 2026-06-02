import { useEffect, useState } from 'react'
import { ChatLayout } from '../../ui/components/ChatLayout'
import { Settings } from '../../ui/components/Settings'
import { Onboarding } from '../../ui/components/Onboarding'
import { ExecutionHistory } from '../../ui/components/ExecutionHistory'
import { Scheduler } from '../../ui/components/Scheduler'
import { AgentProfiles } from '../../ui/components/AgentProfiles'
import { ConversationList } from '../../ui/components/ConversationList'
import { MemoryPanel } from '../../ui/components/MemoryPanel'
import { useChat } from '../../ui/hooks/useChat'
import { getTheme, applyTheme, getConfig } from '../../lib/storage'
import { loadMemory } from '../../lib/memory'

export function App() {
  const [view, setView] = useState<'chat' | 'settings' | 'onboarding' | 'history' | 'scheduler' | 'profiles' | 'conversations' | 'memory'>('chat')
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

  // Apply theme on mount, load memory, check onboarding, and handle pending actions
  useEffect(() => {
    getTheme().then(applyTheme)
    loadMemory()
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
    return <Onboarding onComplete={() => setView('chat')} />
  }

  if (view === 'settings') {
    return <Settings onClose={() => setView('chat')} />
  }

  if (view === 'history') {
    return <ExecutionHistory onClose={() => setView('chat')} />
  }

  if (view === 'scheduler') {
    return <Scheduler onClose={() => setView('chat')} />
  }

  if (view === 'profiles') {
    return <AgentProfiles onClose={() => setView('chat')} />
  }

  if (view === 'memory') {
    return <MemoryPanel onClose={() => setView('chat')} />
  }

  if (view === 'conversations') {
    return (
      <ConversationList
        onClose={() => setView('chat')}
        onSelect={(id) => {
          loadConversation(id)
          setView('chat')
        }}
      />
    )
  }

  return (
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
    />
  )
}
