import { z } from 'zod'
import * as Runtime from '../cdp/domains/runtime'
import { defineTool } from './framework'

export const read_file_from_page = defineTool({
  name: 'read_file_from_page',
  description: 'Read file content from a file input element on the page',
  input: z.object({
    elementId: z.number().describe('Element ID of a file input from take_snapshot'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const el = document.querySelector('[__agent_id="${args.elementId}"]') ||
                   Array.from(document.querySelectorAll('*')).find(e => e.__agent_id === ${args.elementId});
        if (!el) return JSON.stringify({ error: 'Element not found' });
        if (el.tagName !== 'INPUT' || el.type !== 'file') {
          return JSON.stringify({ error: 'Element is not a file input' });
        }
        const files = el.files;
        if (!files || files.length === 0) {
          return JSON.stringify({ error: 'No file selected' });
        }

        return new Promise((resolve) => {
          const file = files[0];
          const reader = new FileReader();
          reader.onload = () => {
            resolve(JSON.stringify({
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result,
            }));
          };
          reader.onerror = () => {
            resolve(JSON.stringify({ error: 'Failed to read file' }));
          };
          reader.readAsText(file);
        });
      })()`,
    )
    if (result.error) {
      response.error(result.error)
      return
    }

    try {
      const data = JSON.parse(result.result || '{}')
      if (data.error) {
        response.error(data.error)
        return
      }
      const content = typeof data.content === 'string' ? data.content : ''
      response.text(
        `File: ${data.name}\nSize: ${data.size} bytes\nType: ${data.type}\n\n` +
        (content.length > 10000 ? content.slice(0, 10000) + '\n...(truncated)' : content)
      )
    } catch {
      response.text(result.result || 'No content')
    }
  },
})

export const get_page_links = defineTool({
  name: 'get_page_links',
  description: 'Extract all links from the current page',
  input: z.object({
    filter: z.string().optional().describe('Filter links by text or URL pattern'),
    sameOrigin: z.boolean().default(false).describe('Only include same-origin links'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        let filtered = links;
        ${args.filter ? `filtered = links.filter(a => a.href.includes('${args.filter.replace(/'/g, "\\'")}') || a.textContent.includes('${args.filter.replace(/'/g, "\\'")}'));` : ''}
        ${args.sameOrigin ? `filtered = filtered.filter(a => a.origin === window.location.origin);` : ''}
        return filtered.slice(0, 100).map(a => {
          const text = a.textContent?.trim().slice(0, 80) || '(no text)';
          return text + ' → ' + a.href;
        }).join('\\n');
      })()`,
    )
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || 'No links found.')
  },
})

export const get_page_images = defineTool({
  name: 'get_page_images',
  description: 'Extract all images from the current page',
  input: z.object({
    minWidth: z.number().default(0).describe('Minimum width filter'),
    minHeight: z.number().default(0).describe('Minimum height filter'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const imgs = Array.from(document.querySelectorAll('img'));
        const filtered = imgs.filter(img => img.naturalWidth >= ${args.minWidth} && img.naturalHeight >= ${args.minHeight});
        return filtered.slice(0, 50).map(img => {
          const alt = img.alt ? '[' + img.alt.slice(0, 40) + ']' : '';
          return img.naturalWidth + 'x' + img.naturalHeight + ' ' + alt + ' ' + img.src.slice(0, 100);
        }).join('\\n');
      })()`,
    )
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || 'No images found.')
  },
})

export const extract_structured_data = defineTool({
  name: 'extract_structured_data',
  description: 'Extract structured data (JSON-LD, microdata, tables) from the page',
  input: z.object({
    type: z.enum(['json-ld', 'tables', 'forms']).describe('Type of data to extract'),
  }),
  handler: async (args, ctx, response) => {
    let expression: string

    switch (args.type) {
      case 'json-ld':
        expression = `(function() {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          return Array.from(scripts).map(s => s.textContent).join('\\n---\\n');
        })()`
        break
      case 'tables':
        expression = `(function() {
          const tables = document.querySelectorAll('table');
          return Array.from(tables).slice(0, 5).map((table, i) => {
            const rows = Array.from(table.querySelectorAll('tr'));
            return 'Table ' + (i+1) + ':\\n' + rows.map(row => {
              const cells = Array.from(row.querySelectorAll('th, td'));
              return cells.map(c => c.textContent?.trim().slice(0, 50)).join(' | ');
            }).join('\\n');
          }).join('\\n\\n');
        })()`
        break
      case 'forms':
        expression = `(function() {
          const forms = document.querySelectorAll('form');
          return Array.from(forms).map((form, i) => {
            const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
            return 'Form ' + (i+1) + ' (action: ' + (form.action || 'none') + '):\\n' +
              inputs.map(inp => {
                const tag = inp.tagName.toLowerCase();
                const name = inp.name || inp.id || '(unnamed)';
                const type = inp.type || tag;
                return '  ' + name + ': ' + type;
              }).join('\\n');
          }).join('\\n\\n');
        })()`
        break
    }

    const result = await Runtime.evaluate(ctx.cdp, ctx.tabId, expression)
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(result.result || 'No data found.')
  },
})

export const download_text = defineTool({
  name: 'download_text',
  description: 'Download text content as a file',
  input: z.object({
    filename: z.string().describe('Filename for the download'),
    content: z.string().describe('Text content to download'),
    mimeType: z.string().default('text/plain').describe('MIME type'),
  }),
  handler: async (args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `(function() {
        const blob = new Blob(['${args.content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'], { type: '${args.mimeType}' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '${args.filename}';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return 'Downloaded: ${args.filename}';
      })()`,
    )
    if (result.error) {
      response.error(result.error)
      return
    }
    response.text(`Downloaded: ${args.filename}`)
  },
})
