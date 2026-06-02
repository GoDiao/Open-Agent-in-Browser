import type { ChatMessage, LLMConfig } from '../types'

export type CompactionStrategy = 'sliding-window' | 'summary' | 'smart'

interface CompactionConfig {
  strategy: CompactionStrategy
  maxMessages: number
  keepRecent: number
  keepToolPairs: boolean
}

const DEFAULT_CONFIG: CompactionConfig = {
  strategy: 'smart',
  maxMessages: 30,
  keepRecent: 10,
  keepToolPairs: true,
}

export function needsCompaction(messages: ChatMessage[]): boolean {
  const nonSystem = messages.filter((m) => m.role !== 'system')
  return nonSystem.length > DEFAULT_CONFIG.maxMessages
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4)
}

export function estimateMessageTokens(message: ChatMessage): number {
  let tokens = estimateTokens(message.content || '')
  if (message.tool_calls) {
    for (const tc of message.tool_calls) {
      tokens += estimateTokens(tc.function.name) + estimateTokens(tc.function.arguments)
    }
  }
  if (message.toolResult) {
    tokens += estimateTokens(message.toolResult)
  }
  return tokens
}

export function estimateTotalTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0)
}

// Strategy 1: Sliding Window - keep most recent N messages
function slidingWindow(messages: ChatMessage[], config: CompactionConfig): ChatMessage[] {
  const systemMsg = messages.find((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  const kept = nonSystem.slice(-config.keepRecent)
  const result: ChatMessage[] = []
  if (systemMsg) result.push(systemMsg)

  if (kept.length < nonSystem.length) {
    result.push({
      role: 'assistant',
      content: `[Context: ${nonSystem.length - kept.length} earlier messages omitted]`,
    })
  }

  result.push(...kept)
  return result
}

// Strategy 2: Summary - summarize middle, keep edges
async function summaryCompaction(
  messages: ChatMessage[],
  config: LLMConfig & CompactionConfig,
): Promise<ChatMessage[]> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  const keepStart = nonSystem.slice(0, 2)
  const toSummarize = nonSystem.slice(2, -config.keepRecent)
  const keepEnd = nonSystem.slice(-config.keepRecent)

  if (toSummarize.length === 0) return messages

  const summaryPrompt = toSummarize
    .map((m) => {
      const content = m.content?.slice(0, 200) || ''
      const tools = m.tool_calls?.map(tc => tc.function.name).join(', ')
      return `[${m.role}]${tools ? ' tools:' + tools : ''}: ${content}`
    })
    .join('\n')

  const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation history concisely. Preserve: key facts, URLs visited, actions taken, errors encountered, and current task state. Output 2-4 sentences.',
        },
        { role: 'user', content: summaryPrompt },
      ],
      stream: false,
      max_tokens: 300,
    }),
  })

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content || 'Previous conversation summarized.'

  const result: ChatMessage[] = []
  if (systemMsg) result.push(systemMsg)
  result.push(...keepStart)
  result.push({ role: 'assistant', content: `[Context compacted — ${toSummarize.length} messages summarized]\n${summary}` })
  result.push(...keepEnd)

  return result
}

// Strategy 3: Smart - preserve tool pairs, summarize user/assistant only
async function smartCompaction(
  messages: ChatMessage[],
  config: LLMConfig & CompactionConfig,
): Promise<ChatMessage[]> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  // Keep recent messages
  const recent = nonSystem.slice(-config.keepRecent)
  const older = nonSystem.slice(0, -config.keepRecent)

  if (older.length === 0) return messages

  // Separate tool-related and non-tool messages
  const toolMessages: ChatMessage[] = []
  const textMessages: ChatMessage[] = []

  for (const msg of older) {
    if (config.keepToolPairs && (msg.role === 'tool' || msg.tool_calls)) {
      toolMessages.push(msg)
    } else {
      textMessages.push(msg)
    }
  }

  // Keep last few tool results (might be referenced)
  const recentTools = toolMessages.slice(-4)
  const oldTools = toolMessages.slice(0, -4)

  // Summarize old text messages
  let summary = ''
  if (textMessages.length > 0) {
    const summaryContent = textMessages
      .map(m => `[${m.role}]: ${(m.content || '').slice(0, 150)}`)
      .join('\n')

    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'Summarize in 1-2 sentences. Focus on task progress and current state.',
            },
            { role: 'user', content: summaryContent },
          ],
          stream: false,
          max_tokens: 150,
        }),
      })
      const data = await response.json()
      summary = data.choices?.[0]?.message?.content || ''
    } catch {
      summary = `${textMessages.length} earlier messages omitted.`
    }
  }

  const result: ChatMessage[] = []
  if (systemMsg) result.push(systemMsg)

  if (summary) {
    result.push({ role: 'assistant', content: `[Context compacted]\n${summary}` })
  }

  // Add back recent tool results if any
  result.push(...recentTools)
  result.push(...recent)

  return result
}

export async function compactMessages(
  messages: ChatMessage[],
  config: LLMConfig,
  strategy: CompactionStrategy = DEFAULT_CONFIG.strategy,
): Promise<ChatMessage[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config, strategy }

  switch (strategy) {
    case 'sliding-window':
      return slidingWindow(messages, fullConfig)
    case 'summary':
      return summaryCompaction(messages, fullConfig)
    case 'smart':
      return smartCompaction(messages, fullConfig)
    default:
      return slidingWindow(messages, fullConfig)
  }
}
