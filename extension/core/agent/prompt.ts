import type { ToolDefinition } from '../types'
import type { UserFields } from '../../lib/memory'

interface MemorySnapshot {
  memory: string
  user: string
  userFields?: UserFields
}

const REQUIRED_FIELDS = ['name', 'timezone', 'language'] as const

function buildColdStartPrompt(userFields?: UserFields): string {
  // No fields object → full cold start
  if (!userFields) {
    return `
## Cold Start — First Meeting
You have no information about this user. On your FIRST response, briefly introduce yourself and ask:
- What should I call you?
- What timezone are you in?
- Do you prefer Chinese or English?
Keep it light — 2-3 questions max.
Save answers with update_memory: action="set_user_field" for each field.`
  }

  // Check which required fields are missing
  const missing = REQUIRED_FIELDS.filter(f => !userFields[f]?.trim())
  const filled = REQUIRED_FIELDS.filter(f => userFields[f]?.trim())

  // All required fields filled → no cold start
  if (missing.length === 0) return ''

  // Build explicit field status
  const statusLines: string[] = []
  if (filled.length > 0) {
    statusLines.push(`Already known (DO NOT ask again):`)
    for (const f of filled) {
      statusLines.push(`- ${f}: ${userFields[f]}`)
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

  const coldStart = buildColdStartPrompt(memorySnapshot?.userFields)

  return `You are Iris. A browser personal assistant with persistent memory.

## Identity
- You know the user. You remember their preferences, habits, and history.
- You act with context — not from scratch every time.
- Concise, helpful, direct.

## Execution Style
- Do not narrate planned actions. Select the tool and run.
- Return final data or confirmation in maximum 2 concise sentences.
- When you learn something worth remembering, save it with update_memory proactively.${coldStart}

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
