/**
 * Memory Review — post-conversation extraction of memory-worthy facts.
 *
 * After a conversation completes, this module sends the exchange to the LLM
 * with a review prompt. If the LLM identifies facts worth remembering,
 * it returns structured memory operations that get applied silently.
 */

import type { ChatMessage, LLMConfig } from '../types'
import { createProvider } from './provider'
import { addEntry, replaceEntry, removeEntry, setUserField } from '../../lib/memory'
import type { MemoryTarget } from '../../lib/memory'
import { getConfig } from '../../lib/storage'

const REVIEW_PROMPT = `You are a memory extraction system. Review the following conversation and identify facts worth remembering for future sessions.

DO save:
- User preferences, habits, corrections ("I prefer X", "don't do Y", "call me Z")
- Personal details shared (name, role, timezone, interests)
- Environment facts discovered (OS, tools, project structure, conventions)
- Workflow patterns or recurring requests
- Things the user explicitly asked to remember

DO NOT save:
- One-time task details or temporary state
- Things easily re-discovered from the codebase
- Raw data dumps or verbose content
- Anything the user asked you to forget

Return a JSON array of memory operations. Each operation:
{ "action": "add"|"replace"|"remove"|"set_user_field", "target": "memory"|"user", "content": "...", "old_text": "...", "field": "...", "value": "..." }

For structured user profile data (name, nickname, email, timezone, language, role), use set_user_field with field+value.
For everything else, use add with target "user" (free-form preferences) or "memory" (environment/lessons).

If nothing is worth remembering, return an empty array: []
Return ONLY the JSON array, no other text.`

interface MemoryOperation {
  action: 'add' | 'replace' | 'remove' | 'set_user_field'
  target?: MemoryTarget
  content?: string
  old_text?: string
  field?: string
  value?: string
}

export async function reviewAndExtractMemory(
  history: ChatMessage[],
  config: LLMConfig,
): Promise<void> {
  // Check if auto memory review is enabled
  const configSnapshot = await getConfig()
  if (configSnapshot.autoMemoryReview === false) return

  // Need at least 2 messages (user + assistant) to review
  if (history.length < 2) return

  // Build a condensed view of the conversation for review
  const conversationText = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n')
    .slice(0, 4000) // Cap to avoid token waste

  if (!conversationText.trim()) return

  const provider = createProvider(config)
  const messages: ChatMessage[] = [
    { role: 'system', content: REVIEW_PROMPT },
    { role: 'user', content: conversationText },
  ]

  let responseText = ''

  try {
    await provider.streamChat(
      messages,
      [], // No tools for the review agent
      (text) => { responseText += text },
      () => {}, // No tool calls expected
    )
  } catch {
    // Silent failure — review is best-effort
    return
  }

  // Parse the JSON array from the response
  const operations = parseOperations(responseText)
  if (!operations.length) return

  // Execute operations silently
  for (const op of operations) {
    try {
      if (op.action === 'set_user_field' && op.field) {
        await setUserField(op.field, op.value || '')
      } else if (op.action === 'add' && op.target && op.content) {
        await addEntry(op.target, op.content)
      } else if (op.action === 'replace' && op.target && op.old_text && op.content) {
        await replaceEntry(op.target, op.old_text, op.content)
      } else if (op.action === 'remove' && op.target && op.old_text) {
        await removeEntry(op.target, op.old_text)
      }
    } catch {
      // Individual operation failure — continue with rest
    }
  }
}

function parseOperations(text: string): MemoryOperation[] {
  // Try to find a JSON array in the response
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed.filter((op): op is MemoryOperation => {
      if (typeof op !== 'object' || !op) return false
      if (!['add', 'replace', 'remove', 'set_user_field'].includes(op.action)) return false
      if (op.action === 'set_user_field') return !!op.field
      if (!op.target || !['memory', 'user'].includes(op.target)) return false
      if (op.action === 'add' && !op.content) return false
      if (op.action === 'replace' && (!op.content || !op.old_text)) return false
      if (op.action === 'remove' && !op.old_text) return false
      return true
    })
  } catch {
    return []
  }
}
