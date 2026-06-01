import { z } from 'zod'
import { defineTool } from './framework'

export const search_history = defineTool({
  name: 'search_history',
  description: 'Search browser history by text query',
  input: z.object({
    query: z.string().describe('Search text'),
    maxResults: z.number().default(20).describe('Max results to return'),
  }),
  handler: async (args, _ctx, response) => {
    const results = await chrome.history.search({
      text: args.query,
      maxResults: args.maxResults,
    })
    if (results.length === 0) {
      response.text('No history results found.')
      return
    }
    const lines = results.map(
      (item) => `${item.visitCount}x — ${item.title || '(untitled)'}\n  ${item.url}`,
    )
    response.text(lines.join('\n'))
  },
})

export const get_recent_history = defineTool({
  name: 'get_recent_history',
  description: 'Get recently visited pages',
  input: z.object({
    maxResults: z.number().default(20).describe('Max results'),
  }),
  handler: async (args, _ctx, response) => {
    const results = await chrome.history.search({
      text: '',
      maxResults: args.maxResults,
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // last 7 days
    })
    if (results.length === 0) {
      response.text('No recent history.')
      return
    }
    const lines = results.map(
      (item) => `${item.title || '(untitled)'} — ${item.url}`,
    )
    response.text(lines.join('\n'))
  },
})

export const delete_history_url = defineTool({
  name: 'delete_history_url',
  description: 'Delete all history entries for a specific URL',
  input: z.object({
    url: z.string().describe('URL to delete from history'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.history.deleteUrl({ url: args.url })
    response.text(`Deleted history for ${args.url}`)
  },
})

export const delete_history_range = defineTool({
  name: 'delete_history_range',
  description: 'Delete history entries in a time range',
  input: z.object({
    startTime: z.number().describe('Start timestamp (ms)'),
    endTime: z.number().optional().describe('End timestamp (ms), default: now'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.history.deleteRange({
      startTime: args.startTime,
      endTime: args.endTime || Date.now(),
    })
    response.text('Deleted history in specified range')
  },
})
