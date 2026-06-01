import { z } from 'zod'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

export const get_network_requests = defineTool({
  name: 'get_network_requests',
  description: 'Get recent network requests from the page (requires page reload after enabling)',
  input: z.object({
    count: z.number().default(30).describe('Number of recent requests'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const reqs = window.__agent_network_requests || [];
        return reqs.slice(-${args.count}).map(r => r.method + ' ' + r.status + ' ' + r.url).join('\\n');
      })()`,
    )
    if (result.error) {
      response.text('No network requests captured.')
      return
    }
    response.text(result.result || 'No network requests.')
  },
})
