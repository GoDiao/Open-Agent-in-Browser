import { z } from 'zod'
import { defineTool } from './framework'
import { addEntry, replaceEntry, removeEntry, setUserField, compactEntries } from '../../lib/memory'

export const update_memory = defineTool({
  name: 'update_memory',
  description: `Save durable information to persistent memory that survives across sessions.
Memory is injected into future turns, so keep it compact and focused on facts that will still matter later.

WHEN TO SAVE (do this proactively, don't wait to be asked):
- User corrects you or says "remember this" / "don't do that again"
- User shares a preference, habit, or personal detail (name, role, timezone, coding style)
- You discover something about the environment (OS, installed tools, project structure)
- You learn a convention, API quirk, or workflow specific to this user's setup
- You identify a stable fact that will be useful again in future sessions

PRIORITY: User preferences and corrections > environment facts > procedural knowledge.
The most valuable memory prevents the user from having to repeat themselves.

Do NOT save task progress, session outcomes, completed-work logs, or temporary TODO state.

TWO TARGETS:
- "user": who the user is — name, role, preferences, communication style, pet peeves
- "memory": your notes — environment facts, project conventions, tool quirks, lessons learned

STRUCTURED USER FIELDS (use set_user_field for these):
- name, nickname, email, timezone, language, role
- These are displayed prominently in the user profile UI.
- Use set_user_field when the user tells you their name, email, timezone, etc.
- Use add(user, ...) for free-form preferences that don't fit a field.

ACTIONS:
- add: append a new entry (requires target + content)
- replace: update existing entry by substring match (requires target + old_text + content)
- remove: delete entry by substring match (requires target + old_text)
- set_user_field: set a structured profile field (requires field + value)
- compact: consolidate entries via LLM (requires target). Merges duplicates, shortens verbose entries, removes stale info. Use when approaching the character limit.`,
  input: z.object({
    action: z.enum(['add', 'replace', 'remove', 'set_user_field', 'compact']).describe('The action to perform.'),
    target: z.enum(['memory', 'user']).optional().describe('Which store: "memory" for personal notes, "user" for user profile. Required for add/replace/remove.'),
    content: z.string().optional().describe('The entry content. Required for add and replace.'),
    old_text: z.string().optional().describe('Short unique substring identifying the entry to replace or remove.'),
    field: z.string().optional().describe('User profile field name. For set_user_field: name, nickname, email, timezone, language, role.'),
    value: z.string().optional().describe('Value to set. For set_user_field.'),
  }),
  handler: async (args, ctx, response) => {
    const { action, target, content, old_text, field, value } = args

    if (action === 'set_user_field') {
      if (!field) {
        response.error('field is required for set_user_field action.')
        return
      }
      const result = await setUserField(field, value || '')
      response.text(JSON.stringify(result))
      return
    }

    if (action === 'compact') {
      if (!target) {
        response.error('target is required for compact action.')
        return
      }
      if (!ctx.config) {
        response.error('LLM config not available for compaction.')
        return
      }
      const result = await compactEntries(target, ctx.config)
      if (result) {
        response.text(JSON.stringify({ success: true, message: 'Memory compacted.', entries: result }))
      } else {
        response.error('Compaction failed or no entries to compact.')
      }
      return
    }

    if (!target) {
      response.error('target is required for add/replace/remove actions.')
      return
    }

    if (action === 'add') {
      if (!content) {
        response.error('Content is required for add action.')
        return
      }
      const result = await addEntry(target, content)
      response.text(JSON.stringify(result))
    } else if (action === 'replace') {
      if (!old_text || !content) {
        response.error('old_text and content are required for replace action.')
        return
      }
      const result = await replaceEntry(target, old_text, content)
      response.text(JSON.stringify(result))
    } else if (action === 'remove') {
      if (!old_text) {
        response.error('old_text is required for remove action.')
        return
      }
      const result = await removeEntry(target, old_text)
      response.text(JSON.stringify(result))
    }
  },
})
