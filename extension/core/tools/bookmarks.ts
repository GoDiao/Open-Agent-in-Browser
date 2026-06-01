import { z } from 'zod'
import { defineTool } from './framework'

export const create_bookmark = defineTool({
  name: 'create_bookmark',
  description: 'Create a new bookmark',
  input: z.object({
    title: z.string().describe('Bookmark title'),
    url: z.string().describe('URL to bookmark'),
    parentId: z.string().optional().describe('Parent folder ID'),
  }),
  handler: async (args, _ctx, response) => {
    const node = await chrome.bookmarks.create({
      title: args.title,
      url: args.url,
      parentId: args.parentId,
    })
    response.text(`Created bookmark "${node.title}" (id: ${node.id})`)
  },
})

export const search_bookmarks = defineTool({
  name: 'search_bookmarks',
  description: 'Search bookmarks by title or URL',
  input: z.object({
    query: z.string().describe('Search query'),
  }),
  handler: async (args, _ctx, response) => {
    const results = await chrome.bookmarks.search(args.query)
    if (results.length === 0) {
      response.text('No bookmarks found.')
      return
    }
    const lines = results.slice(0, 20).map(
      (b) => `${b.id}. ${b.title || '(untitled)'} — ${b.url || '(folder)'}`,
    )
    response.text(lines.join('\n'))
  },
})

export const get_bookmarks = defineTool({
  name: 'get_bookmarks',
  description: 'List bookmarks in a folder (root by default)',
  input: z.object({
    parentId: z.string().optional().describe('Folder ID (default: root)'),
  }),
  handler: async (args, _ctx, response) => {
    const nodes = args.parentId
      ? await chrome.bookmarks.getChildren(args.parentId)
      : (await chrome.bookmarks.getTree())[0]?.children || []
    if (nodes.length === 0) {
      response.text('No bookmarks in this folder.')
      return
    }
    const lines = nodes.map(
      (b) => `${b.id}. ${b.title || '(untitled)'} — ${b.url || '(folder)'}`,
    )
    response.text(lines.join('\n'))
  },
})

export const update_bookmark = defineTool({
  name: 'update_bookmark',
  description: 'Update a bookmark\'s title and/or URL',
  input: z.object({
    id: z.string().describe('Bookmark ID'),
    title: z.string().optional().describe('New title'),
    url: z.string().optional().describe('New URL'),
  }),
  handler: async (args, _ctx, response) => {
    const changes: { title?: string; url?: string } = {}
    if (args.title) changes.title = args.title
    if (args.url) changes.url = args.url
    const node = await chrome.bookmarks.update(args.id, changes)
    response.text(`Updated bookmark "${node.title}"`)
  },
})

export const remove_bookmark = defineTool({
  name: 'remove_bookmark',
  description: 'Remove a bookmark by ID',
  input: z.object({
    id: z.string().describe('Bookmark ID to remove'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.bookmarks.remove(args.id)
    response.text(`Removed bookmark ${args.id}`)
  },
})

export const move_bookmark = defineTool({
  name: 'move_bookmark',
  description: 'Move a bookmark to a different folder',
  input: z.object({
    id: z.string().describe('Bookmark ID'),
    parentId: z.string().describe('Destination folder ID'),
  }),
  handler: async (args, _ctx, response) => {
    const node = await chrome.bookmarks.move(args.id, { parentId: args.parentId })
    response.text(`Moved bookmark "${node.title}" to folder ${args.parentId}`)
  },
})
