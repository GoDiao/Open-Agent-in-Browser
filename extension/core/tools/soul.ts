import { z } from 'zod'
import { defineTool } from './framework'
import { getSoul, updateSoul, resetSoul } from '../../lib/soul'
import type { ToolContext } from '../types'
import { ToolResponse } from '../types'

export const update_soul = defineTool({
  name: 'update_soul',
  description: `Read or update the AI assistant's personality (SOUL).
Defines how AI behaves: personality, communication style, boundaries, and preferences.
Separate from Memory which stores facts about the user.

WHEN TO UPDATE:
- User explicitly asks to change AI's personality or behavior
- User gives feedback about how AI should communicate
- User sets boundaries or rules

ACTIONS:
- read: returns current SOUL configuration
- update: modifies SOUL fields (personality, communicationStyle, boundaries, preferences)
- reset: resets SOUL to default personality`,
  input: z.object({
    action: z.enum(['read', 'update', 'reset']).describe('Action to perform'),
    personality: z.string().optional().describe('AI personality description'),
    communicationStyle: z.string().optional().describe('How AI should communicate'),
    boundaries: z.array(z.string()).optional().describe('List of boundaries/rules AI must follow'),
    preferences: z.array(z.string()).optional().describe('User preferences for AI behavior'),
  }),
  handler: async (args, ctx: ToolContext, response: ToolResponse) => {
    const { action, personality, communicationStyle, boundaries, preferences } = args as {
      action: 'read' | 'update' | 'reset'
      personality?: string
      communicationStyle?: string
      boundaries?: string[]
      preferences?: string[]
    }

    if (action === 'read') {
      const soul = getSoul()
      response.text(formatSoul(soul))
    } else if (action === 'reset') {
      const result = await resetSoul()
      if (result.success) {
        response.text(`SOUL reset to default.\n\n${formatSoul(result.data!)}`)
      } else {
        response.error(result.error || 'Reset failed')
      }
    } else {
      const updates: Parameters<typeof updateSoul>[0] = {}
      if (personality !== undefined) updates.personality = personality
      if (communicationStyle !== undefined) updates.communicationStyle = communicationStyle
      if (boundaries !== undefined) updates.boundaries = boundaries
      if (preferences !== undefined) updates.preferences = preferences

      const result = await updateSoul(updates)
      if (result.success) {
        response.text(`SOUL updated.\n\n${formatSoul(result.data!)}`)
      } else {
        response.error(result.error || 'Update failed')
      }
    }
  },
})

function formatSoul(soul: ReturnType<typeof getSoul>): string {
  const lines: string[] = []
  if (soul.personality) lines.push(`**Personality:** ${soul.personality}`)
  if (soul.communicationStyle) lines.push(`**Communication:** ${soul.communicationStyle}`)
  if (soul.boundaries.length) lines.push(`**Boundaries:**\n- ${soul.boundaries.join('\n- ')}`)
  if (soul.preferences.length) lines.push(`**Preferences:**\n- ${soul.preferences.join('\n- ')}`)
  return lines.join('\n\n') || '(empty)'
}