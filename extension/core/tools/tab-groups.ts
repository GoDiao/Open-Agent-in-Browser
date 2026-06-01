import { z } from 'zod'
import { defineTool } from './framework'

export const create_tab_group = defineTool({
  name: 'create_tab_group',
  description: 'Create a tab group from tab IDs',
  input: z.object({
    tabIds: z.array(z.number()).describe('Tab IDs to group'),
    title: z.string().optional().describe('Group title'),
    color: z.enum(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']).optional().describe('Group color'),
  }),
  handler: async (args, _ctx, response) => {
    const groupId = await chrome.tabs.group({ tabIds: args.tabIds as [number, ...number[]] })
    const update: chrome.tabGroups.UpdateProperties = {}
    if (args.title) update.title = args.title
    if (args.color) update.color = args.color as chrome.tabGroups.Color
    if (Object.keys(update).length > 0) {
      await chrome.tabGroups.update(groupId as number, update)
    }
    response.text(`Created tab group ${groupId}${args.title ? ` "${args.title}"` : ''}`)
  },
})

export const list_tab_groups = defineTool({
  name: 'list_tab_groups',
  description: 'List all tab groups',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const groups = await chrome.tabGroups.query({})
    if (groups.length === 0) {
      response.text('No tab groups.')
      return
    }
    const lines = groups.map(
      (g) => `Group ${g.id}: ${g.title || '(untitled)'} — ${g.color} (${g.collapsed ? 'collapsed' : 'expanded'})`,
    )
    response.text(lines.join('\n'))
  },
})

export const close_tab_group = defineTool({
  name: 'close_tab_group',
  description: 'Close all tabs in a tab group',
  input: z.object({
    groupId: z.number().describe('Group ID to close'),
  }),
  handler: async (args, _ctx, response) => {
    const tabs = await chrome.tabs.query({ groupId: args.groupId })
    const tabIds = tabs.map((t) => t.id!).filter(Boolean)
    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds)
    }
    response.text(`Closed tab group ${args.groupId} (${tabIds.length} tabs)`)
  },
})
