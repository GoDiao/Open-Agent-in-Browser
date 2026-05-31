import { useCallback, useRef, useState } from 'react'
import type { ChatMessage, ToolResult } from '../../core/types'

export interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentToolCall: { name: string; args: string } | null
  error: string | null
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentToolCall, setCurrentToolCall] = useState<{ name: string; args: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    setIsStreaming(true)
    setError(null)
    setCurrentToolCall(null)

    // Add user message immediately
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])

    try {
      await chrome.runtime.sendMessage({
        type: 'chat:send',
        text,
        history: messages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsStreaming(false)
    }
  }, [messages, isStreaming])

  const stop = useCallback(() => {
    setIsStreaming(false)
    setCurrentToolCall(null)
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentToolCall(null)
  }, [])

  const handleBackgroundMessage = useCallback((msg: { type: string; [key: string]: unknown }) => {
    switch (msg.type) {
      case 'chat:stream':
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + (msg.chunk as string) },
            ]
          }
          return [...prev, { role: 'assistant' as const, content: msg.chunk as string }]
        })
        break
      case 'chat:tool_call':
        setCurrentToolCall({ name: msg.name as string, args: msg.args as string })
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant' as const,
            content: '',
            tool_calls: [{ id: '', type: 'function' as const, function: { name: msg.name as string, arguments: msg.args as string } }],
          },
        ])
        break
      case 'chat:tool_result':
        setCurrentToolCall(null)
        setMessages((prev) => [
          ...prev,
          { role: 'tool' as const, content: JSON.stringify(msg.result), tool_call_id: '' },
        ])
        break
      case 'chat:done':
        setIsStreaming(false)
        setCurrentToolCall(null)
        break
      case 'chat:error':
        setError(msg.error as string)
        setIsStreaming(false)
        setCurrentToolCall(null)
        break
    }
  }, [])

  return {
    messages,
    isStreaming,
    currentToolCall,
    error,
    sendMessage,
    stop,
    clear,
    handleBackgroundMessage,
  }
}
