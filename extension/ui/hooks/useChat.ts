import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, Conversation, ToolResult } from '../../core/types'
import { getConversations, saveConversation } from '../../lib/storage'

export interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentToolCall: { name: string; args: string } | null
  error: string | null
  conversationId: string | null
}

export interface AttachedTab {
  id: number
  url: string
  title: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentToolCall, setCurrentToolCall] = useState<{ name: string; args: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attachedTabs, setAttachedTabs] = useState<AttachedTab[]>([])
  const conversationIdRef = useRef<string | null>(null)

  // Generate conversation ID on first message
  const ensureConversationId = useCallback(() => {
    if (!conversationIdRef.current) {
      conversationIdRef.current = crypto.randomUUID()
    }
    return conversationIdRef.current
  }, [])

  // Save current conversation to storage
  const persistConversation = useCallback(async (msgs: ChatMessage[]) => {
    const id = conversationIdRef.current
    if (!id || msgs.length === 0) return

    // Derive title from first user message
    const firstUserMsg = msgs.find((m) => m.role === 'user')
    const title = firstUserMsg?.content.slice(0, 50) || 'New Conversation'

    const conversation: Conversation = {
      id,
      title,
      messages: msgs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveConversation(conversation)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    setIsStreaming(true)
    setError(null)
    setCurrentToolCall(null)

    const conversationId = ensureConversationId()

    // Add user message immediately
    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    try {
      await chrome.runtime.sendMessage({
        type: 'chat:send',
        text,
        history: messages,
        conversationId,
        tabIds: attachedTabs.map((t) => t.id),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsStreaming(false)
    }
  }, [messages, isStreaming, ensureConversationId, attachedTabs])

  const attachTab = useCallback((tab: AttachedTab) => {
    setAttachedTabs((prev) => {
      if (prev.some((t) => t.id === tab.id)) return prev
      return [...prev, tab]
    })
  }, [])

  const detachTab = useCallback((tabId: number) => {
    setAttachedTabs((prev) => prev.filter((t) => t.id !== tabId))
  }, [])

  const stop = useCallback(() => {
    setIsStreaming(false)
    setCurrentToolCall(null)
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentToolCall(null)
    conversationIdRef.current = null
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    const conversations = await getConversations()
    const conversation = conversations.find((c) => c.id === id)
    if (conversation) {
      conversationIdRef.current = conversation.id
      setMessages(conversation.messages)
      setError(null)
      setCurrentToolCall(null)
    }
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
        // Persist conversation after assistant response completes
        setMessages((prev) => {
          persistConversation(prev)
          return prev
        })
        break
      case 'chat:error':
        setError(msg.error as string)
        setIsStreaming(false)
        setCurrentToolCall(null)
        break
    }
  }, [persistConversation])

  return {
    messages,
    isStreaming,
    currentToolCall,
    error,
    conversationId: conversationIdRef.current,
    attachedTabs,
    sendMessage,
    attachTab,
    detachTab,
    stop,
    clear,
    loadConversation,
    handleBackgroundMessage,
  }
}
