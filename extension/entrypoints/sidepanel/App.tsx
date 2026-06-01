import { useEffect, useState } from 'react'
import { ChatLayout } from '../../ui/components/ChatLayout'
import { Settings } from '../../ui/components/Settings'
import { useChat } from '../../ui/hooks/useChat'

export function App() {
  const [view, setView] = useState<'chat' | 'settings'>('chat')
  const {
    messages,
    isStreaming,
    currentToolCall,
    error,
    sendMessage,
    stop,
    clear,
    handleBackgroundMessage,
  } = useChat()

  useEffect(() => {
    const listener = (msg: { type: string; [key: string]: unknown }) => {
      handleBackgroundMessage(msg)
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [handleBackgroundMessage])

  if (view === 'settings') {
    return <Settings onClose={() => setView('chat')} />
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
    />
  )
}
