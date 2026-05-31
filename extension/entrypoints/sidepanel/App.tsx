import { useEffect } from 'react'
import { ChatLayout } from '../../ui/components/ChatLayout'
import { useChat } from '../../ui/hooks/useChat'

export function App() {
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

  return (
    <ChatLayout
      messages={messages}
      isStreaming={isStreaming}
      currentToolCall={currentToolCall}
      error={error}
      onSend={sendMessage}
      onStop={stop}
      onClear={clear}
    />
  )
}
