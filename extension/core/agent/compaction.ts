import type { ChatMessage, LLMConfig } from '../types'

const COMPACTION_THRESHOLD = 25

export function needsCompaction(messages: ChatMessage[]): boolean {
  return messages.filter((m) => m.role !== 'system').length > COMPACTION_THRESHOLD
}

export async function compactMessages(
  messages: ChatMessage[],
  config: LLMConfig,
): Promise<ChatMessage[]> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  const keepStart = nonSystem.slice(0, 2)
  const toSummarize = nonSystem.slice(2, -10)
  const keepEnd = nonSystem.slice(-10)

  if (toSummarize.length === 0) return messages

  const summaryPrompt = toSummarize
    .map((m) => `[${m.role}]: ${m.content?.slice(0, 200) || '(tool call)'}`)
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
        { role: 'system', content: 'Summarize this conversation history in 2-3 sentences, preserving key facts and actions taken.' },
        { role: 'user', content: summaryPrompt },
      ],
      stream: false,
      max_tokens: 200,
    }),
  })

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content || 'Previous conversation summarized.'

  const result: ChatMessage[] = []
  if (systemMsg) result.push(systemMsg)
  result.push(...keepStart)
  result.push({ role: 'assistant', content: `[Context compacted] ${summary}` })
  result.push(...keepEnd)

  return result
}
