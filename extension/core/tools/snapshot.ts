import { z } from 'zod'
import * as Page from '../cdp/domains/page'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

export const take_screenshot = defineTool({
  name: 'take_screenshot',
  description: 'Capture a screenshot of the current page as a PNG image',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    const data = await Page.captureScreenshot(ctx.cdp, ctx.tabId)
    response.image(data, 'image/png')
  },
})

export const take_snapshot = defineTool({
  name: 'take_snapshot',
  description:
    'Get a concise snapshot of interactive elements on the page. Returns a flat list with element IDs that can be used with click, fill, hover, etc. Always take a snapshot before interacting with page elements.',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    const result = await Runtime.evaluate(ctx.cdp, ctx.tabId, getSnapshotScript)
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || 'Page has no interactive elements.')
  },
})

export const get_page_content = defineTool({
  name: 'get_page_content',
  description:
    'Extract the text content of the current page as clean text. For automation use take_snapshot instead.',
  input: z.object({
    selector: z
      .string()
      .optional()
      .describe("CSS selector to scope extraction (e.g. 'main', '.article')"),
  }),
  handler: async (args, ctx, response) => {
    const expression = args.selector
      ? `document.querySelector('${args.selector}')?.innerText || ''`
      : 'document.body.innerText'
    const result = await Runtime.evaluate(ctx.cdp, ctx.tabId, expression)
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || '(empty page)')
  },
})

export const evaluate_script = defineTool({
  name: 'evaluate_script',
  description: 'Execute JavaScript in the current page and return the result',
  input: z.object({
    expression: z.string().describe('JavaScript expression to evaluate'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(ctx.cdp, ctx.tabId, args.expression)
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result ?? 'undefined')
  },
})

// Accessibility tree snapshot script — extracts interactive elements with IDs
const getSnapshotScript = `
(function() {
  const elements = [];
  let id = 0;

  function addElement(el, role) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    const text = (el.innerText || el.value || el.placeholder || el.alt || el.title || '').trim().slice(0, 100);
    if (!text && role !== 'link' && role !== 'image') return;
    id++;
    el.__agent_id = id;
    const tag = el.tagName.toLowerCase();
    const parts = [id + '.'];
    if (role) parts.push('[' + role + ']');
    parts.push(text || '(no text)');
    if (tag === 'a') parts.push('→ ' + (el.href || ''));
    if (tag === 'input') parts.push('type=' + (el.type || 'text'));
    elements.push(parts.join(' '));
  }

  // Interactive elements
  document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [onclick]').forEach(el => {
    const tag = el.tagName.toLowerCase();
    let role = tag;
    if (tag === 'a') role = 'link';
    else if (tag === 'button' || el.getAttribute('role') === 'button') role = 'button';
    else if (tag === 'input') role = 'input';
    else if (tag === 'textarea') role = 'textarea';
    else if (tag === 'select') role = 'select';
    addElement(el, role);
  });

  // Headings for context
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    const text = el.innerText.trim().slice(0, 80);
    if (text) elements.push('# ' + text);
  });

  return elements.join('\\n');
})()
`
