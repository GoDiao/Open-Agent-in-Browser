import { z } from 'zod'
import * as Page from '../cdp/domains/page'
import { defineTool } from './framework'

export const download_file = defineTool({
  name: 'download_file',
  description: 'Download a file from a URL',
  input: z.object({
    url: z.string().describe('URL to download'),
    filename: z.string().optional().describe('Save as filename'),
  }),
  handler: async (args, _ctx, response) => {
    const options: chrome.downloads.DownloadOptions = { url: args.url }
    if (args.filename) options.filename = args.filename
    const id = await chrome.downloads.download(options)
    response.text(`Download started (id: ${id})`)
  },
})

export const save_pdf = defineTool({
  name: 'save_pdf',
  description: 'Save the current page as a PDF file',
  input: z.object({
    filename: z.string().default('page.pdf').describe('PDF filename'),
  }),
  handler: async (args, ctx, response) => {
    const data = await ctx.cdp.sendCommand<string>(ctx.tabId, 'Page.printToPDF', {
      printBackground: true,
    })
    // Save via downloads API using data URL
    const blob = `data:application/pdf;base64,${data}`
    const id = await chrome.downloads.download({
      url: blob,
      filename: args.filename,
      saveAs: true,
    })
    response.text(`PDF download started (id: ${id})`)
  },
})

export const save_screenshot = defineTool({
  name: 'save_screenshot',
  description: 'Save a screenshot of the current page to disk',
  input: z.object({
    filename: z.string().default('screenshot.png').describe('Image filename'),
    fullPage: z.boolean().default(false).describe('Capture full page'),
  }),
  handler: async (args, ctx, response) => {
    const data = await Page.captureScreenshot(ctx.cdp, ctx.tabId)
    const blob = `data:image/png;base64,${data}`
    const id = await chrome.downloads.download({
      url: blob,
      filename: args.filename,
      saveAs: true,
    })
    response.text(`Screenshot download started (id: ${id})`)
  },
})
