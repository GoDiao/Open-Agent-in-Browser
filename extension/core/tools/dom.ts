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
  description: 'Search the DOM by CSS selector or text content. Returns matching elements with context.',
  input: z.object({
    query: z.string().describe('CSS selector or text to search for'),
    mode: z.enum(['selector', 'text', 'auto']).default('auto').describe('Search mode: selector (CSS), text (content), or auto-detect'),
    maxResults: z.number().default(20).describe('Max results'),
    contextLength: z.number().default(50).describe('Characters of context around matches'),
  }),
  handler: async (args, ctx, response) => {
    const mode = args.mode === 'auto'
      ? (args.query.match(/^[a-z.#\[\]:*>~+ ,]+$/i) ? 'selector' : 'text')
      : args.mode

    const script = mode === 'selector'
      ? `(function() {
          const els = document.querySelectorAll('${args.query.replace(/'/g, "\\'")}');
          return Array.from(els).slice(0, ${args.maxResults}).map(el => {
            const tag = el.tagName.toLowerCase();
            const text = el.textContent?.trim().slice(0, 200) || '';
            const id = el.id ? '#' + el.id : '';
            const cls = el.className ? '.' + String(el.className).split(' ').filter(Boolean).join('.') : '';
            const href = el.href ? ' → ' + el.href : '';
            return '<' + tag + id + cls + '>' + href + '\\n  ' + text;
          }).join('\\n\\n');
        })()`
      : `(function() {
          const query = '${args.query.replace(/'/g, "\\'").toLowerCase()}';
          const results = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const text = node.textContent?.toLowerCase() || '';
                return text.includes(query) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              }
            }
          );

          let count = 0;
          while (walker.nextNode() && count < ${args.maxResults}) {
            const node = walker.currentNode;
            const text = node.textContent || '';
            const parent = node.parentElement;
            if (!parent) continue;

            const tag = parent.tagName.toLowerCase();
            const id = parent.id ? '#' + parent.id : '';
            const cls = parent.className ? '.' + String(parent.className).split(' ').filter(Boolean).join('.') : '';

            const idx = text.toLowerCase().indexOf(query);
            const start = Math.max(0, idx - ${args.contextLength});
            const end = Math.min(text.length, idx + query.length + ${args.contextLength});
            const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

            const href = parent.href ? ' → ' + parent.href : '';
            results.push('<' + tag + id + cls + '>' + href + '\\n  "' + snippet + '"');
            count++;
          }
          return results.join('\\n\\n');
        })()`

    const result = await Runtime.evaluate(ctx.cdp, ctx.tabId, script)
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || 'No elements found.')
  },
})
