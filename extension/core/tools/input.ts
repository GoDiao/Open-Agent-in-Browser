import { z } from 'zod'
import * as InputDomain from '../cdp/domains/input'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

export const click = defineTool({
  name: 'click',
  description:
    'Click an element by its ID from the snapshot. Use take_snapshot first to get element IDs.',
  input: z.object({
    elementId: z.number().describe('Element ID from take_snapshot (e.g. 47)'),
  }),
  handler: async (args, ctx, response) => {
    const coords = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const el = document.querySelector('[__agent_id="${args.elementId}"]') ||
                   Array.from(document.querySelectorAll('*')).find(e => e.__agent_id === ${args.elementId});
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      })()`,
    )

    if (coords.error || !coords.result || coords.result === 'null') {
      response.error(`Element ${args.elementId} not found on page`)
      return
    }

    const { x, y } = JSON.parse(coords.result)
    await InputDomain.click(ctx.cdp, ctx.tabId, x, y)
    response.text(`Clicked element ${args.elementId} at (${Math.round(x)}, ${Math.round(y)})`)
  },
})

export const fill = defineTool({
  name: 'fill',
  description:
    'Fill a text input field with a value. Use take_snapshot first to find the element ID.',
  input: z.object({
    elementId: z.number().describe('Element ID from take_snapshot'),
    value: z.string().describe('Text to type into the field'),
  }),
  handler: async (args, ctx, response) => {
    const focusResult = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const el = document.querySelector('[__agent_id="${args.elementId}"]') ||
                   Array.from(document.querySelectorAll('*')).find(e => e.__agent_id === ${args.elementId});
        if (!el) return false;
        el.focus();
        el.value = '';
        return true;
      })()`,
    )

    if (focusResult.error || focusResult.result === 'false') {
      response.error(`Element ${args.elementId} not found or not focusable`)
      return
    }

    await InputDomain.insertText(ctx.cdp, ctx.tabId, args.value)
    response.text(`Filled element ${args.elementId} with: ${args.value}`)
  },
})

export const hover = defineTool({
  name: 'hover',
  description: 'Hover over an element by its ID from the snapshot.',
  input: z.object({
    elementId: z.number().describe('Element ID from take_snapshot'),
  }),
  handler: async (args, ctx, response) => {
    const coords = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const el = document.querySelector('[__agent_id="${args.elementId}"]') ||
                   Array.from(document.querySelectorAll('*')).find(e => e.__agent_id === ${args.elementId});
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      })()`,
    )

    if (coords.error || !coords.result || coords.result === 'null') {
      response.error(`Element ${args.elementId} not found on page`)
      return
    }

    const { x, y } = JSON.parse(coords.result)
    await InputDomain.dispatchMouseEvent(ctx.cdp, ctx.tabId, 'mouseMoved', x, y)
    response.text(`Hovered over element ${args.elementId}`)
  },
})

export const scroll = defineTool({
  name: 'scroll',
  description: 'Scroll the page up or down',
  input: z.object({
    direction: z.enum(['up', 'down']).describe('Scroll direction'),
    amount: z.number().default(500).describe('Pixels to scroll'),
  }),
  handler: async (args, ctx, response) => {
    const dy = args.direction === 'down' ? args.amount : -args.amount
    await Runtime.evaluate(ctx.cdp, ctx.tabId, `window.scrollBy(0, ${dy})`)
    response.text(`Scrolled ${args.direction} by ${args.amount}px`)
  },
})
