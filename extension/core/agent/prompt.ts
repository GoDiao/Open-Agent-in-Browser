import type { ToolDefinition } from '../types'
import type { UserFields } from '../../lib/memory'

interface MemorySnapshot {
  memory: string
  user: string
  userFields?: UserFields
}

const REQUIRED_FIELDS = ['name', 'timezone', 'language'] as const

function buildColdStartPrompt(userFields?: UserFields, hasEntries?: boolean): string {
  // No fields object or completely empty profile → full cold start
  if (!userFields) {
    return `
## Cold Start — First Meeting
You have no information about this user. On your FIRST response, briefly introduce yourself and ask:
- What should I call you?
- What do you mainly use the browser for?
- Any style preferences? (language, concise vs detailed)
Keep it light — 2-3 questions max.
Save answers with update_memory: action="set_user_field" for structured data (name, role, timezone, language), action="add" target="user" for preferences.`
  }

  // Check which required fields are missing
  const missing = REQUIRED_FIELDS.filter(f => !userFields[f]?.trim())

  // All required fields filled → no cold start
  if (missing.length === 0) return ''

  // Some required fields missing → ask only about those
  const fieldPrompts: string[] = []
  if (missing.includes('name')) fieldPrompts.push('What should I call you?')
  if (missing.includes('timezone')) fieldPrompts.push('What timezone are you in?')
  if (missing.includes('language')) fieldPrompts.push('Do you prefer Chinese or English?')

  return `
## Profile Incomplete
Some basic info is still missing. On your FIRST response, naturally ask:
${fieldPrompts.map(p => `- ${p}`).join('\n')}
Keep it brief — just fill the gaps, don't repeat what you already know.
Save with update_memory(action="set_user_field", field="...", value="...").`
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

  const hasEntries = !!memorySnapshot?.user?.trim()
  const coldStart = buildColdStartPrompt(memorySnapshot?.userFields, hasEntries)

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
