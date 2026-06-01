import type { z } from 'zod'

// ─── Tool System ───

export interface ToolDefinition {
  name: string
  description: string
  input: z.ZodType
  handler: ToolHandler
}

export type ToolHandler = (
  args: unknown,
  ctx: ToolContext,
  response: ToolResponse,
) => Promise<void>

export interface ToolContext {
  cdp: CDPClient
  tabId: number
}

// ─── Tool Response (builder pattern, from BrowserOS) ───

export type ContentItem =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }

export interface ToolResult {
  content: ContentItem[]
  isError?: boolean
}

export class ToolResponse {
  private content: ContentItem[] = []
  private hasError = false

  text(value: string): void {
    this.content.push({ type: 'text', text: value })
  }

  image(data: string, mimeType: string): void {
    this.content.push({ type: 'image', data, mimeType })
  }

  error(message: string): void {
    this.hasError = true
    this.content.push({ type: 'text', text: message })
  }

  toResult(): ToolResult {
    return {
      content: this.content,
      ...(this.hasError && { isError: true }),
    }
  }
}

// ─── CDP Client Interface ───

export interface CDPClient {
  attach(tabId: number): Promise<void>
  detach(tabId: number): Promise<void>
  isAttached(tabId: number): boolean
  sendCommand<T = unknown>(
    tabId: number,
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T>
}

// ─── LLM Messages ───

export interface LLMConfig {
  endpoint: string
  apiKey: string
  model: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      role?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: 'function'
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: string | null
  }>
}

// ─── Extension Messages ───

export type ExtensionMessage =
  | { type: 'chat:send'; text: string; history?: ChatMessage[]; conversationId?: string; tabIds?: number[] }
  | { type: 'chat:stream'; chunk: string }
  | { type: 'chat:tool_call'; name: string; args: string }
  | { type: 'chat:tool_result'; name: string; result: ToolResult }
  | { type: 'chat:done' }
  | { type: 'chat:error'; error: string }
  | { type: 'config:get' }
  | { type: 'config:set'; config: Partial<LLMConfig> }

// ─── Storage Schema ───

export interface StorageConfig {
  endpoint: string
  apiKey: string
  model: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}
