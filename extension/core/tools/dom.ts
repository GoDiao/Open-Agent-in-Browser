import { z } from 'zod'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

export const get_dom = defineTool({
  name: 'get_dom',
  description: 'Get the DOM tree or a subtree as HTML. Optionally scope by CSS selector.',
  input: z.object({
    selector: z.string().optional().describe('CSS selector to scope (default: document)'),
    depth: z.number().default(3).describe('Max depth to traverse'),
  }),
  handler: async (args, ctx, response) => {
    const expression = args.selector
      ? `(function() {
          const el = document.querySelector('${args.selector}');
          if (!el) return 'Element not found';
          return el.outerHTML;
        })()`
      : 'document.documentElement.outerHTML'
    const result = await Runtime.evaluate(ctx.cdp, ctx.tabId, expression)
    if (result.error) {
      response.error(result.error)
      return
    }
    const html = result.result || '(empty)'
    response.text(html.length > 8000 ? html.slice(0, 8000) + '\n...(truncated)' : html)
  },
})

export const search_dom = defineTool({
  name: 'search_dom',
  description: 'Search the DOM for elements matching a CSS selector and return their text content',
  input: z.object({
    selector: z.string().describe('CSS selector'),
    maxResults: z.number().default(20).describe('Max results'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const els = document.querySelectorAll('${args.selector}');
        return Array.from(els).slice(0, ${args.maxResults}).map(el => {
          const tag = el.tagName.toLowerCase();
          const text = el.textContent?.trim().slice(0, 100) || '';
          const id = el.id ? '#' + el.id : '';
          const cls = el.className ? '.' + String(el.className).split(' ').join('.') : '';
          return '<' + tag + id + cls + '> ' + text;
        }).join('\\n');
      })()`,
    )
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || 'No elements found.')
  },
})
