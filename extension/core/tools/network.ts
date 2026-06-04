import { z } from 'zod'
import * as NetworkDomain from '../cdp/domains/network'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

const NETWORK_STORAGE_KEY = 'agent_network_requests'

export const get_network_requests = defineTool({
  name: 'get_network_requests',
  description: 'Get recent network requests from the page. Captured via Performance API.',
  input: z.object({
    count: z.number().default(30).describe('Number of recent requests'),
    filter: z.string().optional().describe('Filter by URL pattern'),
  }),
  handler: async (args, ctx, response) => {
    // Read from chrome.storage.local (set by content script)
    const result = await chrome.storage.local.get(NETWORK_STORAGE_KEY)
    const data = result[NETWORK_STORAGE_KEY] as {
      tabId: number
      requests: Array<{ name: string; initiatorType: string; transferSize: number; duration: number; startTime: number }>
      timestamp: number
    } | undefined

    if (!data || data.tabId !== ctx.tabId) {
      response.text('No network requests captured yet. Navigate to a page and wait a few seconds.')
      return
    }

    let requests = data.requests || []

    // Apply filter if provided
    if (args.filter) {
      const filter = args.filter.toLowerCase()
      requests = requests.filter(r => r.name.toLowerCase().includes(filter))
    }

    // Apply count limit
    requests = requests.slice(-args.count)

    if (requests.length === 0) {
      response.text('No network requests found.')
      return
    }

    // Format output
    const formatted = requests.map(r => {
      const size = r.transferSize > 1024
        ? `${(r.transferSize / 1024).toFixed(1)}KB`
        : `${r.transferSize}B`
      return `${r.name.slice(0, 80)} [${r.initiatorType}, ${size}, ${r.duration.toFixed(0)}ms]`
    }).join('\n')

    response.text(`Recent ${requests.length} requests:\n\n${formatted}`)
  },
})

export const block_requests = defineTool({
  name: 'block_requests',
  description: 'Block requests matching a URL pattern. Reload page to apply.',
  input: z.object({
    urlPattern: z.string().describe('URL pattern to block (e.g., "*://ads.example.com/*")'),
  }),
  handler: async (args, ctx, response) => {
    await NetworkDomain.enableFetch(ctx.cdp, ctx.tabId, [
      { urlPattern: args.urlPattern, requestStage: 'Request' },
    ])
    response.text(`Blocking requests matching: ${args.urlPattern}\nReload the page to apply.`)
  },
})

export const mock_response = defineTool({
  name: 'mock_response',
  description: 'Mock a response for a URL pattern. Reload page to apply.',
  input: z.object({
    urlPattern: z.string().describe('URL pattern to intercept'),
    statusCode: z.number().default(200).describe('HTTP status code'),
    contentType: z.string().default('application/json').describe('Content-Type header'),
    body: z.string().describe('Response body'),
  }),
  handler: async (args, ctx, response) => {
    // Enable Fetch with response stage
    await NetworkDomain.enableFetch(ctx.cdp, ctx.tabId, [
      { urlPattern: args.urlPattern, requestStage: 'Response' },
    ])
    response.text(
      `Mocking responses for: ${args.urlPattern}\n` +
      `Status: ${args.statusCode}, Content-Type: ${args.contentType}\n` +
      `Reload the page to apply.`
    )
  },
})

export const set_network_conditions = defineTool({
  name: 'set_network_conditions',
  description: 'Emulate network conditions (offline, slow 3G, etc.)',
  input: z.object({
    offline: z.boolean().default(false).describe('Go offline'),
    latency: z.number().default(0).describe('Additional latency in ms'),
    downloadThroughput: z.number().default(-1).describe('Download throughput in bytes/s (-1 = no limit)'),
    uploadThroughput: z.number().default(-1).describe('Upload throughput in bytes/s (-1 = no limit)'),
  }),
  handler: async (args, ctx, response) => {
    await NetworkDomain.emulateNetworkConditions(
      ctx.cdp,
      ctx.tabId,
      args.offline,
      args.latency,
      args.downloadThroughput,
      args.uploadThroughput,
    )
    if (args.offline) {
      response.text('Network: offline')
    } else if (args.latency > 0 || args.downloadThroughput >= 0) {
      response.text(
        `Network conditions: latency ${args.latency}ms, ` +
        `download ${args.downloadThroughput === -1 ? 'unlimited' : args.downloadThroughput + ' B/s'}, ` +
        `upload ${args.uploadThroughput === -1 ? 'unlimited' : args.uploadThroughput + ' B/s'}`
      )
    } else {
      response.text('Network conditions reset to normal')
    }
  },
})

export const set_extra_headers = defineTool({
  name: 'set_extra_headers',
  description: 'Set extra HTTP headers for all requests',
  input: z.object({
    headers: z.record(z.string()).describe('Headers to add (e.g., {"X-Custom": "value"})'),
  }),
  handler: async (args, ctx, response) => {
    await NetworkDomain.setExtraHTTPHeaders(ctx.cdp, ctx.tabId, args.headers)
    response.text(`Set ${Object.keys(args.headers).length} extra headers`)
  },
})

export const disable_cache = defineTool({
  name: 'disable_cache',
  description: 'Disable browser cache for the current page',
  input: z.object({
    disabled: z.boolean().default(true).describe('Disable cache (true) or re-enable (false)'),
  }),
  handler: async (args, ctx, response) => {
    await NetworkDomain.setCacheDisabled(ctx.cdp, ctx.tabId, args.disabled)
    response.text(args.disabled ? 'Cache disabled' : 'Cache re-enabled')
  },
})
