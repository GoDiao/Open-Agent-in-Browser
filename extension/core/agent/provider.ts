import type { ChatMessage, LLMConfig, StreamChunk, ToolCall } from '../types'

export interface LLMProvider {
  streamChat(
    messages: ChatMessage[],
    tools: Record<string, unknown>[],
    onChunk: (text: string) => void,
    onToolCall: (toolCall: ToolCall) => void,
    signal?: AbortSignal,
  ): Promise<void>
}

export function createProvider(config: LLMConfig): LLMProvider {
  return new OpenAICompatibleProvider(config)
}

class OpenAICompatibleProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async streamChat(
    messages: ChatMessage[],
    tools: Record<string, unknown>[],
    onChunk: (text: string) => void,
    onToolCall: (toolCall: ToolCall) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const url = `${this.config.endpoint.replace(/\/$/, '')}/chat/completions`

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      stream: true,
    }

    if (tools.length > 0) {
      body.tools = tools
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''
    const toolCalls = new Map<number, ToolCall>()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const chunk: StreamChunk = JSON.parse(data)
          const delta = chunk.choices?.[0]?.delta

          if (delta?.content) {
            onChunk(delta.content)
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCalls.get(tc.index)
              if (existing) {
                if (tc.function?.arguments) {
                  existing.function.arguments += tc.function.arguments
                }
              } else {
                if (tc.id && tc.function?.name) {
                  toolCalls.set(tc.index, {
                    id: tc.id,
                    type: 'function',
                    function: {
                      name: tc.function.name,
                      arguments: tc.function.arguments || '',
                    },
                  })
                }
              }
            }
          }

          if (chunk.choices?.[0]?.finish_reason === 'tool_calls') {
            for (const tc of toolCalls.values()) {
              onToolCall(tc)
            }
            toolCalls.clear()
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}
