import { z } from 'zod'
import * as Page from '../cdp/domains/page'
import { defineTool } from './framework'

export const navigate = defineTool({
  name: 'navigate',
  description: 'Navigate the current tab to a URL',
  input: z.object({
    url: z.string().describe('The URL to navigate to'),
  }),
  handler: async (args, ctx, response) => {
    await Page.navigate(ctx.cdp, ctx.tabId, args.url)
    response.text(`Navigated to ${args.url}`)
  },
})

export const list_pages = defineTool({
  name: 'list_pages',
  description: 'List all open tabs in the browser',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const tabs = await chrome.tabs.query({})
    if (tabs.length === 0) {
      response.text('No tabs open.')
      return
    }
    const lines = tabs.map(
      (t) => `${t.id}. ${t.title || '(untitled)'} — ${t.url}${t.active ? ' [ACTIVE]' : ''}`,
    )
    response.text(lines.join('\n'))
  },
})

export const new_page = defineTool({
  name: 'new_page',
  description: 'Open a new tab, optionally with a URL',
  input: z.object({
    url: z.string().optional().describe('URL to open in the new tab'),
  }),
  handler: async (args, _ctx, response) => {
    const tab = await chrome.tabs.create({ url: args.url })
    response.text(`Opened new tab: ${tab.id} — ${tab.url || 'blank'}`)
  },
})

export const close_page = defineTool({
  name: 'close_page',
  description: 'Close a tab by its ID',
  input: z.object({
    tabId: z.number().describe('The tab ID to close'),
  }),
  handler: async (args, ctx, response) => {
    await chrome.tabs.remove(args.tabId)
    if (args.tabId === ctx.tabId) {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (active?.id) {
        ctx.tabId = active.id
      }
    }
    response.text(`Closed tab ${args.tabId}`)
  },
})

export const go_back = defineTool({
  name: 'go_back',
  description: "Go back in the current tab's history",
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await Page.goBack(ctx.cdp, ctx.tabId)
    response.text('Navigated back')
  },
})

export const go_forward = defineTool({
  name: 'go_forward',
  description: "Go forward in the current tab's history",
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await Page.goForward(ctx.cdp, ctx.tabId)
    response.text('Navigated forward')
  },
})

export const reload = defineTool({
  name: 'reload',
  description: 'Reload the current page',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await Page.reload(ctx.cdp, ctx.tabId)
    response.text('Page reloaded')
  },
})
