import { z } from 'zod'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

export const get_console_logs = defineTool({
  name: 'get_console_logs',
  description: 'Get console logs from the current page by evaluating a script that captures them',
  input: z.object({
    count: z.number().default(50).describe('Number of recent logs to return'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const logs = window.__agent_console_logs || [];
        return logs.slice(-${args.count}).map(l => '[' + l.level + '] ' + l.text).join('\\n');
      })()`,
    )
    if (result.error) {
      // Fallback: just return a message
      response.text('No console logs captured. Console logging is injected on page load.')
      return
    }
    response.text(result.result || 'No console logs.')
  },
})
