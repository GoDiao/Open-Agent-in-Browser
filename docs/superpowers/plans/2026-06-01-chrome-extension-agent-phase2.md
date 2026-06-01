# Chrome Extension Agent — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Chrome extension agent from 10 core tools to 35+ tools, add New Tab/Popup/Options pages, and implement conversation persistence, tool toggles, multi-tab context, page context injection, and compaction.

**Architecture:** Follow existing patterns — each tool group is a file in `core/tools/`, each UI page is a WXT entrypoint, features modify existing modules (storage, agent loop, registry). All new tools use `defineTool` + Zod schemas.

**Tech Stack:** WXT, React, TypeScript, Tailwind CSS, Zod, lucide-react, shiki, streamdown

---

## File Map

```
extension/
├── core/tools/
│   ├── bookmarks.ts          # NEW — Bookmark CRUD tools
│   ├── history.ts            # NEW — History search/delete tools
│   ├── windows.ts            # NEW — Window management tools
│   ├── tab-groups.ts         # NEW — Tab group tools
│   ├── downloads.ts          # NEW — Download/save tools
│   ├── console.ts            # NEW — Console log tool
│   ├── dom.ts                # NEW — DOM query tools
│   ├── network.ts            # NEW — Network inspection tool
│   ├── registry.ts           # MODIFY — add tool toggle support
│   └── framework.ts          # (unchanged)
├── core/cdp/domains/
│   ├── console.ts            # NEW — CDP Console domain
│   └── network.ts            # NEW — CDP Network domain
├── core/agent/
│   ├── loop.ts               # MODIFY — register new tools, multi-tab ctx, compaction
│   ├── prompt.ts             # MODIFY — add page context injection
│   └── compaction.ts         # NEW — context compression
├── lib/
│   ├── storage.ts            # MODIFY — add conversation persistence + tool settings
│   └── config.ts             # NEW — config management helpers
├── entrypoints/
│   ├── background.ts         # MODIFY — wire conversation save
│   ├── sidepanel/App.tsx     # MODIFY — load/save conversations
│   ├── newtab/               # NEW — New Tab page
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── popup/                # NEW — Popup
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── options/              # NEW — Options page
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── ui/components/
│   ├── OptionsPage.tsx       # NEW — Settings with tool toggles
│   ├── NewTabPage.tsx        # NEW — Home page with quick actions
│   └── PopupApp.tsx          # NEW — Quick popup UI
```

---

## Task 1: Bookmarks Tools

**Files:**
- Create: `extension/core/tools/bookmarks.ts`

- [ ] **Step 1: Create bookmarks tools**

```typescript
// extension/core/tools/bookmarks.ts
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
    const changes: chrome.bookmarks.BookmarkChangesArg = { id: args.id }
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
```

- [ ] **Step 2: Verify**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add extension/core/tools/bookmarks.ts
git commit -m "feat: add bookmark tools (create, search, get, update, remove, move)"
```

---

## Task 2: History Tools

**Files:**
- Create: `extension/core/tools/history.ts`

- [ ] **Step 1: Create history tools**

```typescript
// extension/core/tools/history.ts
import { z } from 'zod'
import { defineTool } from './framework'

export const search_history = defineTool({
  name: 'search_history',
  description: 'Search browser history by text query',
  input: z.object({
    query: z.string().describe('Search text'),
    maxResults: z.number().default(20).describe('Max results to return'),
  }),
  handler: async (args, _ctx, response) => {
    const results = await chrome.history.search({
      text: args.query,
      maxResults: args.maxResults,
    })
    if (results.length === 0) {
      response.text('No history results found.')
      return
    }
    const lines = results.map(
      (item) => `${item.visitCount}x — ${item.title || '(untitled)'}\n  ${item.url}`,
    )
    response.text(lines.join('\n'))
  },
})

export const get_recent_history = defineTool({
  name: 'get_recent_history',
  description: 'Get recently visited pages',
  input: z.object({
    maxResults: z.number().default(20).describe('Max results'),
  }),
  handler: async (args, _ctx, response) => {
    const results = await chrome.history.search({
      text: '',
      maxResults: args.maxResults,
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // last 7 days
    })
    if (results.length === 0) {
      response.text('No recent history.')
      return
    }
    const lines = results.map(
      (item) => `${item.title || '(untitled)'} — ${item.url}`,
    )
    response.text(lines.join('\n'))
  },
})

export const delete_history_url = defineTool({
  name: 'delete_history_url',
  description: 'Delete all history entries for a specific URL',
  input: z.object({
    url: z.string().describe('URL to delete from history'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.history.deleteUrl({ url: args.url })
    response.text(`Deleted history for ${args.url}`)
  },
})

export const delete_history_range = defineTool({
  name: 'delete_history_range',
  description: 'Delete history entries in a time range',
  input: z.object({
    startTime: z.number().describe('Start timestamp (ms)'),
    endTime: z.number().optional().describe('End timestamp (ms), default: now'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.history.deleteRange({
      startTime: args.startTime,
      endTime: args.endTime || Date.now(),
    })
    response.text('Deleted history in specified range')
  },
})
```

- [ ] **Step 2: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/tools/history.ts
git commit -m "feat: add history tools (search, recent, delete_url, delete_range)"
```

---

## Task 3: Windows + Tab Groups Tools

**Files:**
- Create: `extension/core/tools/windows.ts`
- Create: `extension/core/tools/tab-groups.ts`

- [ ] **Step 1: Create windows tools**

```typescript
// extension/core/tools/windows.ts
import { z } from 'zod'
import { defineTool } from './framework'

export const list_windows = defineTool({
  name: 'list_windows',
  description: 'List all browser windows',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const windows = await chrome.windows.getAll({ populate: true })
    if (windows.length === 0) {
      response.text('No windows found.')
      return
    }
    const lines = windows.map((w) => {
      const tabCount = w.tabs?.length || 0
      const active = w.focused ? ' [FOCUSED]' : ''
      return `Window ${w.id} (${tabCount} tabs)${active} — ${w.type}`
    })
    response.text(lines.join('\n'))
  },
})

export const create_window = defineTool({
  name: 'create_window',
  description: 'Create a new browser window',
  input: z.object({
    url: z.string().optional().describe('URL to open in new window'),
    incognito: z.boolean().default(false).describe('Open in incognito mode'),
  }),
  handler: async (args, _ctx, response) => {
    const win = await chrome.windows.create({
      url: args.url,
      incognito: args.incognito,
    })
    response.text(`Created window ${win.id} (${args.incognito ? 'incognito' : 'normal'})`)
  },
})

export const close_window = defineTool({
  name: 'close_window',
  description: 'Close a browser window',
  input: z.object({
    windowId: z.number().describe('Window ID to close'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.windows.remove(args.windowId)
    response.text(`Closed window ${args.windowId}`)
  },
})

export const focus_window = defineTool({
  name: 'focus_window',
  description: 'Focus a browser window',
  input: z.object({
    windowId: z.number().describe('Window ID to focus'),
  }),
  handler: async (args, _ctx, response) => {
    await chrome.windows.update(args.windowId, { focused: true })
    response.text(`Focused window ${args.windowId}`)
  },
})
```

- [ ] **Step 2: Create tab-groups tools**

```typescript
// extension/core/tools/tab-groups.ts
import { z } from 'zod'
import { defineTool } from './framework'

export const create_tab_group = defineTool({
  name: 'create_tab_group',
  description: 'Create a tab group from tab IDs',
  input: z.object({
    tabIds: z.array(z.number()).describe('Tab IDs to group'),
    title: z.string().optional().describe('Group title'),
    color: z.enum(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']).optional().describe('Group color'),
  }),
  handler: async (args, _ctx, response) => {
    const groupId = await chrome.tabs.group({ tabIds: args.tabIds })
    const update: chrome.tabGroups.UpdateProperties = {}
    if (args.title) update.title = args.title
    if (args.color) update.color = args.color as chrome.tabGroups.ColorEnum
    if (Object.keys(update).length > 0) {
      await chrome.tabGroups.update(groupId, update)
    }
    response.text(`Created tab group ${groupId}${args.title ? ` "${args.title}"` : ''}`)
  },
})

export const list_tab_groups = defineTool({
  name: 'list_tab_groups',
  description: 'List all tab groups',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const groups = await chrome.tabGroups.query({})
    if (groups.length === 0) {
      response.text('No tab groups.')
      return
    }
    const lines = groups.map(
      (g) => `Group ${g.id}: ${g.title || '(untitled)'} — ${g.color} (${g.collapsed ? 'collapsed' : 'expanded'})`,
    )
    response.text(lines.join('\n'))
  },
})

export const close_tab_group = defineTool({
  name: 'close_tab_group',
  description: 'Close all tabs in a tab group',
  input: z.object({
    groupId: z.number().describe('Group ID to close'),
  }),
  handler: async (args, _ctx, response) => {
    const tabs = await chrome.tabs.query({ groupId: args.groupId })
    const tabIds = tabs.map((t) => t.id!).filter(Boolean)
    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds)
    }
    response.text(`Closed tab group ${args.groupId} (${tabIds.length} tabs)`)
  },
})
```

- [ ] **Step 3: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/tools/windows.ts extension/core/tools/tab-groups.ts
git commit -m "feat: add window and tab group tools"
```

---

## Task 4: Downloads Tools

**Files:**
- Create: `extension/core/tools/downloads.ts`

- [ ] **Step 1: Create downloads tools**

```typescript
// extension/core/tools/downloads.ts
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
```

- [ ] **Step 2: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/tools/downloads.ts
git commit -m "feat: add download tools (download_file, save_pdf, save_screenshot)"
```

---

## Task 5: Console + Network CDP Domains & Tools

**Files:**
- Create: `extension/core/cdp/domains/console.ts`
- Create: `extension/core/cdp/domains/network.ts`
- Create: `extension/core/tools/console.ts`
- Create: `extension/core/tools/network.ts`

- [ ] **Step 1: Console CDP domain**

```typescript
// extension/core/cdp/domains/console.ts
import type { CDPClient } from '../../types'

export interface ConsoleMessage {
  level: string
  text: string
  url?: string
  line?: number
}

export async function enable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Console.enable')
}

export async function disable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Console.disable')
}
```

- [ ] **Step 2: Network CDP domain**

```typescript
// extension/core/cdp/domains/network.ts
import type { CDPClient } from '../../types'

export interface RequestInfo {
  url: string
  method: string
  status?: number
  type?: string
}

export async function enable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.enable')
}

export async function disable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.disable')
}
```

- [ ] **Step 3: Console tool**

```typescript
// extension/core/tools/console.ts
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
```

- [ ] **Step 4: Network tool**

```typescript
// extension/core/tools/network.ts
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
```

- [ ] **Step 5: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/cdp/domains/ extension/core/tools/console.ts extension/core/tools/network.ts
git commit -m "feat: add console/network CDP domains and inspection tools"
```

---

## Task 6: DOM Tools

**Files:**
- Create: `extension/core/tools/dom.ts`

- [ ] **Step 1: Create DOM tools**

```typescript
// extension/core/tools/dom.ts
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
```

- [ ] **Step 2: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/tools/dom.ts
git commit -m "feat: add DOM tools (get_dom, search_dom)"
```

---

## Task 7: Register All New Tools in Agent Loop

**Files:**
- Modify: `extension/core/agent/loop.ts`

- [ ] **Step 1: Update loop.ts to register all new tools**

Add imports for all new tool files and register them in `registerTools()`. The changes:

```typescript
// Add these imports at the top of loop.ts:
import { create_bookmark, search_bookmarks, get_bookmarks, update_bookmark, remove_bookmark, move_bookmark } from '../tools/bookmarks'
import { search_history, get_recent_history, delete_history_url, delete_history_range } from '../tools/history'
import { list_windows, create_window, close_window, focus_window } from '../tools/windows'
import { create_tab_group, list_tab_groups, close_tab_group } from '../tools/tab-groups'
import { download_file, save_pdf, save_screenshot } from '../tools/downloads'
import { get_console_logs } from '../tools/console'
import { get_network_requests } from '../tools/network'
import { get_dom, search_dom } from '../tools/dom'

// In registerTools(), add to the tools array:
// ... existing tools,
create_bookmark, search_bookmarks, get_bookmarks, update_bookmark, remove_bookmark, move_bookmark,
search_history, get_recent_history, delete_history_url, delete_history_range,
list_windows, create_window, close_window, focus_window,
create_tab_group, list_tab_groups, close_tab_group,
download_file, save_pdf, save_screenshot,
get_console_logs, get_network_requests,
get_dom, search_dom,
```

- [ ] **Step 2: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/agent/loop.ts
git commit -m "feat: register all new tools in agent loop (35+ total)"
```

---

## Task 8: Conversation Persistence

**Files:**
- Modify: `extension/lib/storage.ts`
- Modify: `extension/ui/hooks/useChat.ts`
- Modify: `extension/entrypoints/background.ts`

- [ ] **Step 1: Update storage.ts with conversation CRUD**

Add to existing `storage.ts`:

```typescript
// Add to existing storage.ts
import type { Conversation, ChatMessage } from '../core/types'

export async function getConversations(): Promise<Conversation[]> {
  const result = await chrome.storage.local.get('conversations')
  return (result.conversations as Conversation[] | undefined) || []
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const conversations = await getConversations()
  const index = conversations.findIndex((c) => c.id === conversation.id)
  if (index >= 0) {
    conversations[index] = conversation
  } else {
    conversations.unshift(conversation)
  }
  await chrome.storage.local.set({ conversations: conversations.slice(0, 50) })
}

export async function deleteConversation(id: string): Promise<void> {
  const conversations = await getConversations()
  await chrome.storage.local.set({
    conversations: conversations.filter((c) => c.id !== id),
  })
}
```

- [ ] **Step 2: Update useChat hook to persist conversations**

Modify `extension/ui/hooks/useChat.ts` to save messages after each exchange and load on mount.

- [ ] **Step 3: Update background.ts to pass conversation ID**

- [ ] **Step 4: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/lib/storage.ts extension/ui/hooks/useChat.ts extension/entrypoints/background.ts
git commit -m "feat: add conversation persistence via chrome.storage.local"
```

---

## Task 9: Tool Toggle Settings

**Files:**
- Modify: `extension/core/tools/registry.ts`
- Modify: `extension/ui/components/Settings.tsx`

- [ ] **Step 1: Add tool enable/disable to registry**

Add to `extension/core/tools/registry.ts`:

```typescript
// Add to ToolRegistry class
private disabled = new Set<string>()

setEnabled(name: string, enabled: boolean): void {
  if (enabled) {
    this.disabled.delete(name)
  } else {
    this.disabled.add(name)
  }
}

isEnabled(name: string): boolean {
  return !this.disabled.has(name)
}

getEnabled(): ToolDefinition[] {
  return this.all().filter((t) => this.isEnabled(t.name))
}
```

- [ ] **Step 2: Update Settings.tsx to show tool toggles**

Add a collapsible tool list in Settings with toggle switches for each tool group.

- [ ] **Step 3: Update agent loop to use `getEnabled()` instead of `all()`**

- [ ] **Step 4: Persist tool settings in storage**

- [ ] **Step 5: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/tools/registry.ts extension/ui/components/Settings.tsx extension/core/agent/loop.ts
git commit -m "feat: add tool enable/disable toggles in settings"
```

---

## Task 10: Multi-Tab Context

**Files:**
- Modify: `extension/core/agent/loop.ts`
- Modify: `extension/ui/hooks/useChat.ts`
- Modify: `extension/ui/components/ChatInput.tsx`

- [ ] **Step 1: Add tabId to agent loop context**

Modify `executeTool` in `loop.ts` to accept a `tabId` parameter (from the user's selected tabs or active tab).

- [ ] **Step 2: Add tab selector to ChatInput**

Add a small tab indicator showing current active tab, with ability to "attach" additional tabs.

- [ ] **Step 3: Pass attached tabs to background with message**

- [ ] **Step 4: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/agent/loop.ts extension/ui/hooks/useChat.ts extension/ui/components/ChatInput.tsx
git commit -m "feat: add multi-tab context support"
```

---

## Task 11: Page Context Injection

**Files:**
- Modify: `extension/core/agent/prompt.ts`

- [ ] **Step 1: Update system prompt to include current page context**

Add to `buildSystemPrompt`:

```typescript
// Add page context parameter
export function buildSystemPrompt(tools: ToolDefinition[], pageContext?: { url: string; title: string }): string {
  const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')

  const contextSection = pageContext
    ? `\n## Current Page\nURL: ${pageContext.url}\nTitle: ${pageContext.title}\n`
    : ''

  return `You are a browser automation agent. You can control the user's browser using the available tools.
${contextSection}
## Workflow
1. Always take a snapshot (take_snapshot) before interacting with elements to get their IDs.
2. Use element IDs from the snapshot with click, fill, hover tools.
3. After making changes, take a snapshot or screenshot to verify the result.

## Available Tools
${toolList}

## Guidelines
- Be concise in your responses.
- Explain what you're doing before using tools.
- If a tool fails, report the error and suggest alternatives.`
}
```

- [ ] **Step 2: Update agent loop to fetch and pass page context**

Before each `run()` call, query the active tab's URL and title, pass to `buildSystemPrompt`.

- [ ] **Step 3: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/agent/prompt.ts extension/core/agent/loop.ts
git commit -m "feat: inject current page context into system prompt"
```

---

## Task 12: Context Compaction

**Files:**
- Create: `extension/core/agent/compaction.ts`
- Modify: `extension/core/agent/loop.ts`

- [ ] **Step 1: Create compaction module**

```typescript
// extension/core/agent/compaction.ts
import type { ChatMessage, LLMConfig } from '../types'

const MAX_MESSAGES = 30
const COMPACTION_THRESHOLD = 25

export function needsCompaction(messages: ChatMessage[]): boolean {
  return messages.filter((m) => m.role !== 'system').length > COMPACTION_THRESHOLD
}

export async function compactMessages(
  messages: ChatMessage[],
  config: LLMConfig,
): Promise<ChatMessage[]> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  // Keep first 2 and last 10 messages, summarize the middle
  const keepStart = nonSystem.slice(0, 2)
  const toSummarize = nonSystem.slice(2, -10)
  const keepEnd = nonSystem.slice(-10)

  if (toSummarize.length === 0) return messages

  // Use the LLM to summarize
  const summaryPrompt = toSummarize
    .map((m) => `[${m.role}]: ${m.content?.slice(0, 200) || '(tool call)'}`)
    .join('\n')

  const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: 'Summarize this conversation history in 2-3 sentences, preserving key facts and actions taken.' },
        { role: 'user', content: summaryPrompt },
      ],
      stream: false,
      max_tokens: 200,
    }),
  })

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content || 'Previous conversation summarized.'

  const result: ChatMessage[] = []
  if (systemMsg) result.push(systemMsg)
  result.push(...keepStart)
  result.push({ role: 'assistant', content: `[Context compacted] ${summary}` })
  result.push(...keepEnd)

  return result
}
```

- [ ] **Step 2: Integrate into agent loop**

In `run()`, before sending to LLM, check `needsCompaction(messages)` and call `compactMessages` if needed.

- [ ] **Step 3: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/core/agent/compaction.ts extension/core/agent/loop.ts
git commit -m "feat: add context compaction for long conversations"
```

---

## Task 13: Options Page

**Files:**
- Create: `extension/entrypoints/options/index.html`
- Create: `extension/entrypoints/options/main.tsx`
- Create: `extension/entrypoints/options/App.tsx`
- Create: `extension/ui/components/OptionsPage.tsx`

- [ ] **Step 1: Create entrypoint files**

```html
<!-- extension/entrypoints/options/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Open Agent — Settings</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

```tsx
// extension/entrypoints/options/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '../sidepanel/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```tsx
// extension/entrypoints/options/App.tsx
import { OptionsPage } from '../../ui/components/OptionsPage'

export function App() {
  return <OptionsPage />
}
```

- [ ] **Step 2: Create OptionsPage component**

Full settings page with API config, tool toggles, conversation management, and theme toggle. Uses `chrome.storage.local` for persistence.

- [ ] **Step 3: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/entrypoints/options/ extension/ui/components/OptionsPage.tsx
git commit -m "feat: add options page with full settings, tool toggles, conversation management"
```

---

## Task 14: New Tab Page

**Files:**
- Create: `extension/entrypoints/newtab/index.html`
- Create: `extension/entrypoints/newtab/main.tsx`
- Create: `extension/entrypoints/newtab/App.tsx`
- Create: `extension/ui/components/NewTabPage.tsx`
- Modify: `extension/wxt.config.ts`

- [ ] **Step 1: Create entrypoint files**

```html
<!-- extension/entrypoints/newtab/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Open Agent</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create NewTabPage**

Shows: logo, quick action cards (Navigate, Screenshot, Summarize), recent conversations list, current page info.

- [ ] **Step 3: Add `chrome_url_overrides` to wxt.config.ts**

```typescript
// Add to manifest in wxt.config.ts
chrome_url_overrides: {
  newtab: 'newtab.html',
},
```

- [ ] **Step 4: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/entrypoints/newtab/ extension/ui/components/NewTabPage.tsx extension/wxt.config.ts
git commit -m "feat: add new tab page with quick actions and recent conversations"
```

---

## Task 15: Popup

**Files:**
- Create: `extension/entrypoints/popup/index.html`
- Create: `extension/entrypoints/popup/main.tsx`
- Create: `extension/entrypoints/popup/App.tsx`
- Create: `extension/ui/components/PopupApp.tsx`

- [ ] **Step 1: Create entrypoint files**

- [ ] **Step 2: Create PopupApp**

Compact popup with: quick input field, "Open Sidepanel" button, "Screenshot this page" button, "Summarize this page" button. Results open in sidepanel.

- [ ] **Step 3: Verify + Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension && bunx tsc --noEmit
git add extension/entrypoints/popup/ extension/ui/components/PopupApp.tsx
git commit -m "feat: add popup with quick actions and sidepanel shortcut"
```

---

## Summary

**Phase 2 delivers:**
- 35+ tools (bookmarks, history, windows, tab groups, downloads, console, network, DOM)
- New Tab page with quick actions
- Popup with quick actions
- Options page with full settings + tool toggles
- Conversation persistence
- Multi-tab context
- Page context injection in system prompt
- Context compaction for long conversations

**Total tools after Phase 2:** ~35 (10 Phase 1 + 25 Phase 2)
