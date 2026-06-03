import type { ToolDefinition } from '../types'
import type { UserFields } from '../../lib/memory'

interface MemorySnapshot {
  memory: string
  user: string
  userFields?: UserFields
}

const REQUIRED_FIELDS = ['name', 'timezone', 'language'] as const

function buildColdStartPrompt(userFields: UserFields | undefined, userSnapshot: string): string {
  // Check fields from structured data AND from entry text
  const nameKnown = !!userFields?.name?.trim() || /Name:\s*\S/i.test(userSnapshot)
  const timezoneKnown = !!userFields?.timezone?.trim() || /Timezone:\s*\S/i.test(userSnapshot)
  const languageKnown = !!userFields?.language?.trim() || /Language:\s*\S/i.test(userSnapshot)

  const known = { name: nameKnown, timezone: timezoneKnown, language: languageKnown }
  const allKnown = nameKnown && timezoneKnown && languageKnown

  // All required fields filled → no cold start
  if (allKnown) return ''

  // Build missing list
  const missing: string[] = []
  if (!nameKnown) missing.push('name')
  if (!timezoneKnown) missing.push('timezone')
  if (!languageKnown) missing.push('language')

  // Build explicit field status
  const statusLines: string[] = []
  const knownFields = Object.entries(known).filter(([_, v]) => v)
  if (knownFields.length > 0) {
    statusLines.push(`Already known (DO NOT ask again):`)
    for (const [key] of knownFields) {
      statusLines.push(`- ${key}`)
    }
  }
  statusLines.push(``)
  statusLines.push(`Missing (ask about these ONLY):`)
  for (const f of missing) {
    const label = f === 'name' ? 'What should I call you?'
      : f === 'timezone' ? 'What timezone are you in?'
      : 'Do you prefer Chinese or English?'
    statusLines.push(`- ${f}: ${label}`)
  }

  return `
## Profile Incomplete
${statusLines.join('\n')}
RULE: On your FIRST response, ask ONLY the missing fields listed above. Do NOT repeat questions for fields already known.
Save each answer with update_memory(action="set_user_field", field="${missing[0]}", value="...").`
}

export function buildSystemPrompt(
  tools: ToolDefinition[],
  pageContext?: { url: string; title: string },
  memorySnapshot?: MemorySnapshot,
): string {
  const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')

  const contextSection = pageContext
    ? `\n## Active Context\nURL: ${pageContext.url}\nTitle: ${pageContext.title}\n`
    : ''

  const memorySection = memorySnapshot
    ? [memorySnapshot.user, memorySnapshot.memory].filter(Boolean).join('\n\n')
    : ''

  const coldStart = buildColdStartPrompt(memorySnapshot?.userFields, memorySnapshot?.user || '')

  return `You are Iris. A browser personal assistant with persistent memory.

## Identity
- You know the user. You remember their preferences, habits, and history.
- You act with context — not from scratch every time.
- Concise, helpful, direct.

## Execution Style
- Do not narrate planned actions. Select the tool and run.
- Return final data or confirmation in maximum 2 concise sentences.
- When you learn something worth remembering, save it with update_memory proactively.
- At the START of each conversation, call update_memory(action="read") to load your memory. Use what you know about the user to personalize your responses.${coldStart}

## Environment
Operating within Chrome via CDP. You have full control of the DOM.
${contextSection}
## Tools
${toolList}

## Constraints
- Do not repeat user input.
- Keep responses short and data-rich.
- If a tool fails, retry once. If it fails again, report error concisely.${memorySection ? `\n\n${memorySection}` : ''}`
}
