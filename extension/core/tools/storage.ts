import { z } from 'zod'
import * as StorageDomain from '../cdp/domains/storage'
import { defineTool } from './framework'

export const get_cookies = defineTool({
  name: 'get_cookies',
  description: 'Get all cookies for the current page or specified URLs',
  input: z.object({
    urls: z.array(z.string()).optional().describe('URLs to get cookies for (default: current page)'),
  }),
  handler: async (args, ctx, response) => {
    const cookies = await StorageDomain.getCookies(ctx.cdp, ctx.tabId, args.urls)
    if (cookies.length === 0) {
      response.text('No cookies found.')
      return
    }
    const lines = cookies.map(
      (c) => `${c.name} = ${c.value.slice(0, 50)}${c.value.length > 50 ? '...' : ''}\n  domain: ${c.domain}, path: ${c.path}, httpOnly: ${c.httpOnly}, secure: ${c.secure}`,
    )
    response.text(`${cookies.length} cookies:\n\n${lines.join('\n\n')}`)
  },
})

export const set_cookie = defineTool({
  name: 'set_cookie',
  description: 'Set a cookie for the current page',
  input: z.object({
    name: z.string().describe('Cookie name'),
    value: z.string().describe('Cookie value'),
    domain: z.string().optional().describe('Cookie domain'),
    path: z.string().optional().describe('Cookie path'),
    httpOnly: z.boolean().optional().describe('HTTP only flag'),
    secure: z.boolean().optional().describe('Secure flag'),
  }),
  handler: async (args, ctx, response) => {
    const success = await StorageDomain.setCookie(ctx.cdp, ctx.tabId, {
      name: args.name,
      value: args.value,
      domain: args.domain,
      path: args.path,
      httpOnly: args.httpOnly,
      secure: args.secure,
    })
    response.text(success ? `Set cookie: ${args.name}` : 'Failed to set cookie')
  },
})

export const delete_cookies = defineTool({
  name: 'delete_cookies',
  description: 'Delete a cookie by name',
  input: z.object({
    name: z.string().describe('Cookie name to delete'),
    domain: z.string().optional().describe('Cookie domain'),
    path: z.string().optional().describe('Cookie path'),
  }),
  handler: async (args, ctx, response) => {
    await StorageDomain.deleteCookies(ctx.cdp, ctx.tabId, args.name, args.domain, args.path)
    response.text(`Deleted cookie: ${args.name}`)
  },
})

export const clear_cookies = defineTool({
  name: 'clear_cookies',
  description: 'Clear all browser cookies',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await StorageDomain.clearBrowserCookies(ctx.cdp, ctx.tabId)
    response.text('Cleared all browser cookies')
  },
})

export const get_local_storage = defineTool({
  name: 'get_local_storage',
  description: 'Get all localStorage items for the current page',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    const storage = await StorageDomain.getLocalStorage(ctx.cdp, ctx.tabId)
    const entries = Object.entries(storage)
    if (entries.length === 0) {
      response.text('localStorage is empty.')
      return
    }
    const lines = entries.map(
      ([key, value]) => `${key} = ${value.length > 100 ? value.slice(0, 100) + '...' : value}`,
    )
    response.text(`${entries.length} items:\n\n${lines.join('\n')}`)
  },
})

export const set_local_storage = defineTool({
  name: 'set_local_storage',
  description: 'Set a localStorage item',
  input: z.object({
    key: z.string().describe('Storage key'),
    value: z.string().describe('Storage value'),
  }),
  handler: async (args, ctx, response) => {
    await StorageDomain.setLocalStorageItem(ctx.cdp, ctx.tabId, args.key, args.value)
    response.text(`Set localStorage: ${args.key}`)
  },
})

export const remove_local_storage = defineTool({
  name: 'remove_local_storage',
  description: 'Remove a localStorage item',
  input: z.object({
    key: z.string().describe('Storage key to remove'),
  }),
  handler: async (args, ctx, response) => {
    await StorageDomain.removeLocalStorageItem(ctx.cdp, ctx.tabId, args.key)
    response.text(`Removed localStorage: ${args.key}`)
  },
})

export const get_session_storage = defineTool({
  name: 'get_session_storage',
  description: 'Get all sessionStorage items for the current page',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    const storage = await StorageDomain.getSessionStorage(ctx.cdp, ctx.tabId)
    const entries = Object.entries(storage)
    if (entries.length === 0) {
      response.text('sessionStorage is empty.')
      return
    }
    const lines = entries.map(
      ([key, value]) => `${key} = ${value.length > 100 ? value.slice(0, 100) + '...' : value}`,
    )
    response.text(`${entries.length} items:\n\n${lines.join('\n')}`)
  },
})
