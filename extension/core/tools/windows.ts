import { z } from 'zod'
import { defineTool } from './framework'

export const list_windows = defineTool({
  name: 'list_windows',
  description: 'List all browser windows',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const windows = await chrome.windows.getAll({ populate: true })
    if (windows.length === 0) {
      response.text('No windows found.')
      return
    }
    const lines = windows.map((w) => {
      const tabCount = w.tabs?.length || 0
      const active = w.focused ? ' [FOCUSED]' : ''
      return `Window ${w.id} (${tabCount} tabs)${active} — ${w.type}`
    })
    response.text(lines.join('\n'))
  },
})

export const create_window = defineTool({
  name: 'create_window',
  description: 'Create a new browser window',
  input: z.object({
    url: z.string().optional().describe('URL to open in new window'),
    incognito: z.boolean().default(false).describe('Open in incognito mode'),
  }),
  handler: async (args, _ctx, response) => {
    const win = await chrome.windows.create({
      url: args.url,
      incognito: args.incognito,
    })
    response.text(`Created window ${win?.id} (${args.incognito ? 'incognito' : 'normal'})`)
  },
})

export const close_window = defineTool({
  name: 'close_window',
  description: 'Close a browser window',
  input: z.object({
    windowId: z.number().describe('Window ID to close'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.windows.remove(args.windowId)
    response.text(`Closed window ${args.windowId}`)
  },
})

export const focus_window = defineTool({
  name: 'focus_window',
  description: 'Focus a browser window',
  input: z.object({
    windowId: z.number().describe('Window ID to focus'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.windows.update(args.windowId, { focused: true })
    response.text(`Focused window ${args.windowId}`)
  },
})
