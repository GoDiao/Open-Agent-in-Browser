# Chrome Extension Agent — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal runnable Chrome extension with an AI Agent that can chat and control the browser via 10 core tools.

**Architecture:** WXT + React extension with a background Service Worker running the agent loop (OpenAI Compatible API), a sidepanel chat UI, and a CDP client wrapping `chrome.debugger` for browser automation.

**Tech Stack:** WXT, React 18, TypeScript, Tailwind CSS, Shadcn UI, Zod, Bun

---

## File Map

```
extension/
├── wxt.config.ts                          # WXT config + manifest
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── core/
│   ├── types.ts                           # Shared types (ToolDefinition, ToolContext, ToolResult, messages)
│   ├── cdp/
│   │   ├── client.ts                      # chrome.debugger wrapper
│   │   └── domains/
│   │       ├── page.ts                    # Page domain (navigate, screenshot, getTree)
│   │       ├── dom.ts                     # DOM domain (querySelector, getOuterHTML)
│   │       ├── input.ts                   # Input domain (dispatchMouseEvent, dispatchKeyEvent)
│   │       └── runtime.ts                 # Runtime domain (evaluate)
│   ├── tools/
│   │   ├── framework.ts                   # defineTool helper
│   │   ├── registry.ts                    # ToolRegistry
│   │   ├── navigation.ts                  # navigate, list_pages, new_page, close_page
│   │   ├── snapshot.ts                    # take_screenshot, take_snapshot, get_page_content, evaluate_script
│   │   └── input.ts                       # click, fill
│   └── agent/
│       ├── provider.ts                    # OpenAI Compatible HTTP client
│       ├── loop.ts                        # Tool call loop
│       └── prompt.ts                      # System prompt builder
├── lib/
│   ├── storage.ts                         # chrome.storage wrapper
│   ├── messaging.ts                       # Message types + helpers
│   └── config.ts                          # Config management
├── ui/
│   ├── components/
│   │   ├── ChatLayout.tsx                 # Main layout shell
│   │   ├── ChatMessages.tsx               # Message list
│   │   ├── ChatMessage.tsx                # Single message bubble
│   │   ├── ChatInput.tsx                  # Input bar
│   │   ├── ToolResult.tsx                 # Tool execution display
│   │   └── Screenshot.tsx                 # Inline screenshot preview
│   └── hooks/
│       └── useChat.ts                     # Chat state management
├── entrypoints/
│   ├── background.ts                      # Service Worker entry
│   └── sidepanel/
│       ├── index.html
│       ├── main.tsx                       # React mount
│       └── App.tsx                        # Root component
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `extension/package.json`
- Create: `extension/wxt.config.ts`
- Create: `extension/tsconfig.json`
- Create: `extension/tailwind.config.ts`

- [ ] **Step 1: Initialize WXT project**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser
bunx wxt@latest init extension --template react
cd extension
```

- [ ] **Step 2: Install dependencies**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension
bun add zod
bun add -d tailwindcss @tailwindcss/vite @types/chrome
```

- [ ] **Step 3: Configure WXT manifest**

Edit `extension/wxt.config.ts`:

```typescript
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Open Agent',
    description: 'AI Agent for your browser',
    permissions: [
      'activeTab',
      'debugger',
      'storage',
      'tabs',
      'sidePanel',
      'bookmarks',
      'history',
      'tabGroups',
      'downloads',
      'scripting',
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Open Agent',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
})
```

- [ ] **Step 4: Create directory structure**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension
mkdir -p core/cdp/domains core/tools core/agent lib ui/components ui/hooks entrypoints/sidepanel
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension
bun run dev
```

Expected: WXT compiles without errors, generates `dist/` directory.

- [ ] **Step 6: Commit**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser
git init
git add extension/
git commit -m "chore: scaffold WXT + React extension project"
```

---

## Task 2: Core Types

**Files:**
- Create: `extension/core/types.ts`

- [ ] **Step 1: Define core types**

```typescript
// extension/core/types.ts
import type { z } from 'zod'

// ─── Tool System ───

export interface ToolDefinition {
  name: string
  description: string
  input: z.ZodType
  handler: ToolHandler
}

export type ToolHandler = (
  args: unknown,
  ctx: ToolContext,
  response: ToolResponse,
) => Promise<void>

export interface ToolContext {
  cdp: CDPClient
  tabId: number
}

// ─── Tool Response (builder pattern, from BrowserOS) ───

export type ContentItem =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }

export interface ToolResult {
  content: ContentItem[]
  isError?: boolean
}

export class ToolResponse {
  private content: ContentItem[] = []
  private hasError = false

  text(value: string): void {
    this.content.push({ type: 'text', text: value })
  }

  image(data: string, mimeType: string): void {
    this.content.push({ type: 'image', data, mimeType })
  }

  error(message: string): void {
    this.hasError = true
    this.content.push({ type: 'text', text: message })
  }

  toResult(): ToolResult {
    return {
      content: this.content,
      ...(this.hasError && { isError: true }),
    }
  }
}

// ─── CDP Client Interface ───

export interface CDPClient {
  attach(tabId: number): Promise<void>
  detach(tabId: number): Promise<void>
  isAttached(tabId: number): boolean
  sendCommand<T = unknown>(
    tabId: number,
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T>
}

// ─── LLM Messages ───

export interface LLMConfig {
  endpoint: string
  apiKey: string
  model: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      role?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: 'function'
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: string | null
  }>
}

// ─── Extension Messages ───

export type ExtensionMessage =
  | { type: 'chat:send'; text: string }
  | { type: 'chat:stream'; chunk: string }
  | { type: 'chat:tool_call'; toolCall: ToolCall }
  | { type: 'chat:tool_result'; toolCallId: string; result: ToolResult }
  | { type: 'chat:done' }
  | { type: 'chat:error'; error: string }
  | { type: 'config:get' }
  | { type: 'config:set'; config: Partial<LLMConfig> }

// ─── Storage Schema ───

export interface StorageConfig {
  endpoint: string
  apiKey: string
  model: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension
bunx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add extension/core/types.ts
git commit -m "feat: define core types for tools, CDP, LLM, and messaging"
```

---

## Task 3: CDP Client

**Files:**
- Create: `extension/core/cdp/client.ts`

- [ ] **Step 1: Implement CDPClient**

```typescript
// extension/core/cdp/client.ts
import type { CDPClient } from '../types'

export class ChromeDebuggerClient implements CDPClient {
  private attached = new Set<number>()

  async attach(tabId: number): Promise<void> {
    if (this.attached.has(tabId)) return
    await chrome.debugger.attach({ tabId }, '1.3')
    this.attached.add(tabId)
  }

  async detach(tabId: number): Promise<void> {
    if (!this.attached.has(tabId)) return
    try {
      await chrome.debugger.detach({ tabId })
    } catch {
      // Already detached
    }
    this.attached.delete(tabId)
  }

  isAttached(tabId: number): boolean {
    return this.attached.has(tabId)
  }

  async sendCommand<T = unknown>(
    tabId: number,
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.attached.has(tabId)) {
      await this.attach(tabId)
    }
    const result = await chrome.debugger.sendCommand(
      { tabId },
      method,
      params,
    )
    return result as T
  }

  async ensureAttached(tabId: number): Promise<void> {
    if (!this.attached.has(tabId)) {
      await this.attach(tabId)
    }
  }

  async detachAll(): Promise<void> {
    for (const tabId of this.attached) {
      try {
        await chrome.debugger.detach({ tabId })
      } catch {
        // Ignore
      }
    }
    this.attached.clear()
  }
}

export function createCDPClient(): CDPClient {
  return new ChromeDebuggerClient()
}
```

- [ ] **Step 2: Commit**

```bash
git add extension/core/cdp/client.ts
git commit -m "feat: implement CDPClient wrapping chrome.debugger"
```

---

## Task 4: CDP Domain Wrappers

**Files:**
- Create: `extension/core/cdp/domains/page.ts`
- Create: `extension/core/cdp/domains/dom.ts`
- Create: `extension/core/cdp/domains/input.ts`
- Create: `extension/core/cdp/domains/runtime.ts`

- [ ] **Step 1: Page domain**

```typescript
// extension/core/cdp/domains/page.ts
import type { CDPClient } from '../../types'

export interface PageInfo {
  url: string
  title: string
  tabId: number
}

export async function navigate(
  cdp: CDPClient,
  tabId: number,
  url: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.navigate', { url })
}

export async function captureScreenshot(
  cdp: CDPClient,
  tabId: number,
): Promise<string> {
  const result = await cdp.sendCommand<{ data: string }>(
    tabId,
    'Page.captureScreenshot',
    { format: 'png' },
  )
  return result.data
}

export async function getFrameTree(
  cdp: CDPClient,
  tabId: number,
): Promise<Record<string, unknown>> {
  return cdp.sendCommand(tabId, 'Page.getFrameTree')
}

export async function reload(
  cdp: CDPClient,
  tabId: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.reload')
}

export async function goBack(
  cdp: CDPClient,
  tabId: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.goBack')
}

export async function goForward(
  cdp: CDPClient,
  tabId: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.goForward')
}
```

- [ ] **Step 2: DOM domain**

```typescript
// extension/core/cdp/domains/dom.ts
import type { CDPClient } from '../../types'

export interface DOMNode {
  nodeId: number
  nodeName: string
  nodeType: number
 nodeValue?: string
  children?: DOMNode[]
  attributes?: Record<string, string>
  backendNodeId?: number
}

export async function getDocument(
  cdp: CDPClient,
  tabId: number,
): Promise<DOMNode> {
  const result = await cdp.sendCommand<{ root: DOMNode }>(
    tabId,
    'DOM.getDocument',
    { depth: -1 },
  )
  return result.root
}

export async function querySelector(
  cdp: CDPClient,
  tabId: number,
  nodeId: number,
  selector: string,
): Promise<number> {
  const result = await cdp.sendCommand<{ nodeId: number }>(
    tabId,
    'DOM.querySelector',
    { nodeId, selector },
  )
  return result.nodeId
}

export async function getOuterHTML(
  cdp: CDPClient,
  tabId: number,
  nodeId: number,
): Promise<string> {
  const result = await cdp.sendCommand<{ outerHTML: string }>(
    tabId,
    'DOM.getOuterHTML',
    { nodeId },
  )
  return result.outerHTML
}

export async function getAttributes(
  cdp: CDPClient,
  tabId: number,
  nodeId: number,
): Promise<Record<string, string>> {
  const result = await cdp.sendCommand<{ attributes: string[] }>(
    tabId,
    'DOM.getAttributes',
    { nodeId },
  )
  const attrs: Record<string, string> = {}
  for (let i = 0; i < result.attributes.length; i += 2) {
    attrs[result.attributes[i]] = result.attributes[i + 1]
  }
  return attrs
}

export async function getBoxModel(
  cdp: CDPClient,
  tabId: number,
  nodeId: number,
): Promise<number[] | null> {
  try {
    const result = await cdp.sendCommand<{
      model: { content: number[] }
    }>(tabId, 'DOM.getBoxModel', { nodeId })
    return result.model.content
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Input domain**

```typescript
// extension/core/cdp/domains/input.ts
import type { CDPClient } from '../../types'

export async function dispatchMouseEvent(
  cdp: CDPClient,
  tabId: number,
  type: 'mousePressed' | 'mouseReleased' | 'mouseMoved',
  x: number,
  y: number,
  button: 'left' | 'right' | 'middle' = 'left',
): Promise<void> {
  await cdp.sendCommand(tabId, 'Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button,
    clickCount: type === 'mousePressed' || type === 'mouseReleased' ? 1 : 0,
  })
}

export async function click(
  cdp: CDPClient,
  tabId: number,
  x: number,
  y: number,
): Promise<void> {
  await dispatchMouseEvent(cdp, tabId, 'mousePressed', x, y)
  await dispatchMouseEvent(cdp, tabId, 'mouseReleased', x, y)
}

export async function dispatchKeyEvent(
  cdp: CDPClient,
  tabId: number,
  type: 'keyDown' | 'keyUp' | 'char',
  text?: string,
  key?: string,
): Promise<void> {
  const params: Record<string, unknown> = { type }
  if (text) params.text = text
  if (key) params.key = key
  await cdp.sendCommand(tabId, 'Input.dispatchKeyEvent', params)
}

export async function insertText(
  cdp: CDPClient,
  tabId: number,
  text: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Input.insertText', { text })
}
```

- [ ] **Step 4: Runtime domain**

```typescript
// extension/core/cdp/domains/runtime.ts
import type { CDPClient } from '../../types'

export interface EvaluateResult {
  result?: string
  error?: string
  exceptionDetails?: Record<string, unknown>
}

export async function evaluate(
  cdp: CDPClient,
  tabId: number,
  expression: string,
): Promise<EvaluateResult> {
  const result = await cdp.sendCommand<{
    result?: { value?: string; type?: string }
    exceptionDetails?: { text: string }
  }>(tabId, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
  })

  if (result.exceptionDetails) {
    return { error: result.exceptionDetails.text }
  }

  return {
    result: result.result?.value !== undefined
      ? String(result.result.value)
      : undefined,
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add extension/core/cdp/domains/
git commit -m "feat: add CDP domain wrappers (page, dom, input, runtime)"
```

---

## Task 5: Tool Framework + Registry

**Files:**
- Create: `extension/core/tools/framework.ts`
- Create: `extension/core/tools/registry.ts`

- [ ] **Step 1: Tool framework**

```typescript
// extension/core/tools/framework.ts
import type { z } from 'zod'
import type { ToolContext, ToolDefinition, ToolResponse } from '../types'

export function defineTool<
  TInput extends z.ZodType,
>(config: {
  name: string
  description: string
  input: TInput
  handler: (
    args: z.infer<TInput>,
    ctx: ToolContext,
    response: ToolResponse,
  ) => Promise<void>
}): ToolDefinition {
  return config as ToolDefinition
}

export function toolToJsonSchema(tool: ToolDefinition): Record<string, unknown> {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.input),
    },
  }
}

function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const [key, value] of Object.entries(shape)) {
      const field = value as z.ZodType
      properties[key] = zodFieldToJsonSchema(field)
      if (!field.isOptional()) {
        required.push(key)
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
    }
  }

  return { type: 'object', properties: {} }
}

function zodFieldToJsonSchema(field: z.ZodType): Record<string, unknown> {
  if (field instanceof z.ZodString) return { type: 'string' }
  if (field instanceof z.ZodNumber) return { type: 'number' }
  if (field instanceof z.ZodBoolean) return { type: 'boolean' }
  if (field instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(field.unwrap())
  }
  if (field instanceof z.ZodDefault) {
    return zodFieldToJsonSchema(field.removeDefault())
  }
  return { type: 'string' }
}
```

- [ ] **Step 2: Tool registry**

```typescript
// extension/core/tools/registry.ts
import type { ToolDefinition } from '../types'

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  all(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  names(): string[] {
    return Array.from(this.tools.keys())
  }
}

export function createRegistry(): ToolRegistry {
  return new ToolRegistry()
}
```

- [ ] **Step 3: Commit**

```bash
git add extension/core/tools/framework.ts extension/core/tools/registry.ts
git commit -m "feat: add tool framework (defineTool) and registry"
```

---

## Task 6: Core Tools — Navigation

**Files:**
- Create: `extension/core/tools/navigation.ts`

- [ ] **Step 1: Implement navigation tools**

```typescript
// extension/core/tools/navigation.ts
import { z } from 'zod'
import * as Page from '../cdp/domains/page'
import { defineTool } from './framework'

export const navigate = defineTool({
  name: 'navigate',
  description: 'Navigate the current tab to a URL',
  input: z.object({
    url: z.string().describe('The URL to navigate to'),
  }),
  handler: async (args, ctx, response) => {
    await Page.navigate(ctx.cdp, ctx.tabId, args.url)
    response.text(`Navigated to ${args.url}`)
  },
})

export const list_pages = defineTool({
  name: 'list_pages',
  description: 'List all open tabs in the browser',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const tabs = await chrome.tabs.query({})
    if (tabs.length === 0) {
      response.text('No tabs open.')
      return
    }
    const lines = tabs.map(
      (t) => `${t.id}. ${t.title || '(untitled)'} — ${t.url}${t.active ? ' [ACTIVE]' : ''}`,
    )
    response.text(lines.join('\n'))
  },
})

export const new_page = defineTool({
  name: 'new_page',
  description: 'Open a new tab, optionally with a URL',
  input: z.object({
    url: z.string().optional().describe('URL to open in the new tab'),
  }),
  handler: async (args, _ctx, response) => {
    const tab = await chrome.tabs.create({ url: args.url })
    response.text(`Opened new tab: ${tab.id} — ${tab.url || 'blank'}`)
  },
})

export const close_page = defineTool({
  name: 'close_page',
  description: 'Close a tab by its ID',
  input: z.object({
    tabId: z.number().describe('The tab ID to close'),
  }),
  handler: async (args, ctx, response) => {
    await chrome.tabs.remove(args.tabId)
    if (args.tabId === ctx.tabId) {
      // Current tab was closed, get new active tab
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (active?.id) {
        ctx.tabId = active.id
      }
    }
    response.text(`Closed tab ${args.tabId}`)
  },
})

export const go_back = defineTool({
  name: 'go_back',
  description: 'Go back in the current tab\'s history',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await Page.goBack(ctx.cdp, ctx.tabId)
    response.text('Navigated back')
  },
})

export const go_forward = defineTool({
  name: 'go_forward',
  description: 'Go forward in the current tab\'s history',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await Page.goForward(ctx.cdp, ctx.tabId)
    response.text('Navigated forward')
  },
})

export const reload = defineTool({
  name: 'reload',
  description: 'Reload the current page',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    await Page.reload(ctx.cdp, ctx.tabId)
    response.text('Page reloaded')
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add extension/core/tools/navigation.ts
git commit -m "feat: add navigation tools (navigate, list_pages, new_page, close_page, go_back, go_forward, reload)"
```

---

## Task 7: Core Tools — Snapshot

**Files:**
- Create: `extension/core/tools/snapshot.ts`

- [ ] **Step 1: Implement snapshot tools**

```typescript
// extension/core/tools/snapshot.ts
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
    'Get a concise snapshot of interactive elements on the page. Returns a flat list with element IDs that can be used with click, fill, etc. Always take a snapshot before interacting with page elements.',
  input: z.object({}),
  handler: async (_args, ctx, response) => {
    const result = await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      getSnapshotScript,
    )
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
```

- [ ] **Step 2: Commit**

```bash
git add extension/core/tools/snapshot.ts
git commit -m "feat: add snapshot tools (take_screenshot, take_snapshot, get_page_content, evaluate_script)"
```

---

## Task 8: Core Tools — Input

**Files:**
- Create: `extension/core/tools/input.ts`

- [ ] **Step 1: Implement input tools**

```typescript
// extension/core/tools/input.ts
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
    // Get element center coordinates from its agent ID
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
    // Focus the element and clear it, then insert text
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
  description:
    'Hover over an element by its ID from the snapshot.',
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
    await Runtime.evaluate(
      ctx.cdp,
      ctx.tabId,
      `window.scrollBy(0, ${dy})`,
    )
    response.text(`Scrolled ${args.direction} by ${args.amount}px`)
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add extension/core/tools/input.ts
git commit -m "feat: add input tools (click, fill, hover, scroll)"
```

---

## Task 9: LLM Provider

**Files:**
- Create: `extension/core/agent/provider.ts`

- [ ] **Step 1: Implement OpenAI Compatible client**

```typescript
// extension/core/agent/provider.ts
import type { ChatMessage, LLMConfig, StreamChunk, ToolCall } from '../types'

export interface LLMProvider {
  streamChat(
    messages: ChatMessage[],
    tools: Record<string, unknown>[],
    onChunk: (text: string) => void,
    onToolCall: (toolCall: ToolCall) => void,
    signal?: AbortSignal,
  ): Promise<void>
}

export function createProvider(config: LLMConfig): LLMProvider {
  return new OpenAICompatibleProvider(config)
}

class OpenAICompatibleProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async streamChat(
    messages: ChatMessage[],
    tools: Record<string, unknown>[],
    onChunk: (text: string) => void,
    onToolCall: (toolCall: ToolCall) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const url = `${this.config.endpoint.replace(/\/$/, '')}/chat/completions`

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      stream: true,
    }

    if (tools.length > 0) {
      body.tools = tools
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''
    // Accumulate tool calls across chunks
    const toolCalls = new Map<number, ToolCall>()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const chunk: StreamChunk = JSON.parse(data)
          const delta = chunk.choices?.[0]?.delta

          if (delta?.content) {
            onChunk(delta.content)
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCalls.get(tc.index)
              if (existing) {
                // Accumulate arguments
                if (tc.function?.arguments) {
                  existing.function.arguments += tc.function.arguments
                }
              } else {
                // New tool call
                if (tc.id && tc.function?.name) {
                  toolCalls.set(tc.index, {
                    id: tc.id,
                    type: 'function',
                    function: {
                      name: tc.function.name,
                      arguments: tc.function.arguments || '',
                    },
                  })
                }
              }
            }
          }

          if (chunk.choices?.[0]?.finish_reason === 'tool_calls') {
            for (const tc of toolCalls.values()) {
              onToolCall(tc)
            }
            toolCalls.clear()
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add extension/core/agent/provider.ts
git commit -m "feat: implement OpenAI Compatible LLM provider with streaming"
```

---

## Task 10: Agent Loop

**Files:**
- Create: `extension/core/agent/loop.ts`
- Create: `extension/core/agent/prompt.ts`

- [ ] **Step 1: System prompt**

```typescript
// extension/core/agent/prompt.ts
import type { ToolDefinition } from '../types'

export function buildSystemPrompt(tools: ToolDefinition[]): string {
  const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')

  return `You are a browser automation agent. You can control the user's browser using the available tools.

## Current Context
You are operating inside the user's Chrome browser. You have access to the active tab and can navigate, interact with elements, read page content, and take screenshots.

## Workflow
1. Always take a snapshot (take_snapshot) before interacting with elements to get their IDs.
2. Use element IDs from the snapshot with click, fill, hover tools.
3. After making changes, take a snapshot or screenshot to verify the result.
4. If something fails, try a different approach.

## Available Tools
${toolList}

## Guidelines
- Be concise in your responses.
- Explain what you're doing before using tools.
- If a tool fails, report the error and suggest alternatives.
- Respect the user's privacy — don't access sensitive data without explicit instruction.`
}
```

- [ ] **Step 2: Agent loop**

```typescript
// extension/core/agent/loop.ts
import { createCDPClient } from '../cdp/client'
import { createRegistry } from '../tools/registry'
import type { ChatMessage, CDPClient, LLMConfig, ToolCall, ToolResult } from '../types'
import { buildSystemPrompt } from './prompt'
import { createProvider } from './provider'

// Import all tools
import { close_page, go_back, go_forward, list_pages, navigate, new_page, reload } from '../tools/navigation'
import { evaluate_script, get_page_content, take_screenshot, take_snapshot } from '../tools/snapshot'
import { click, fill, hover, scroll } from '../tools/input'
import { ToolResponse } from '../types'

export interface AgentCallbacks {
  onStream: (text: string) => void
  onToolCall: (name: string, args: string) => void
  onToolResult: (name: string, result: ToolResult) => void
  onDone: () => void
  onError: (error: string) => void
}

export class AgentLoop {
  private cdp: CDPClient
  private registry = createRegistry()
  private provider

  constructor(config: LLMConfig) {
    this.cdp = createCDPClient()
    this.provider = createProvider(config)
    this.registerTools()
  }

  private registerTools(): void {
    const tools = [
      navigate, list_pages, new_page, close_page, go_back, go_forward, reload,
      take_screenshot, take_snapshot, get_page_content, evaluate_script,
      click, fill, hover, scroll,
    ]
    for (const tool of tools) {
      this.registry.register(tool)
    }
  }

  async run(
    userMessage: string,
    history: ChatMessage[],
    callbacks: AgentCallbacks,
    signal?: AbortSignal,
  ): Promise<ChatMessage[]> {
    const systemPrompt = buildSystemPrompt(this.registry.all())
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ]

    const newMessages: ChatMessage[] = [
      { role: 'user', content: userMessage },
    ]

    const tools = this.registry.all().map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: zodToJsonSchema(t.input),
      },
    }))

    let maxIterations = 20 // Safety limit

    while (maxIterations-- > 0) {
      let assistantContent = ''
      const toolCallsToExecute: ToolCall[] = []

      try {
        await this.provider.streamChat(
          messages,
          tools,
          (text) => {
            assistantContent += text
            callbacks.onStream(text)
          },
          (toolCall) => {
            toolCallsToExecute.push(toolCall)
          },
          signal,
        )
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        callbacks.onError(errorMsg)
        break
      }

      // Add assistant message
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
      }
      if (toolCallsToExecute.length > 0) {
        assistantMsg.tool_calls = toolCallsToExecute
      }
      messages.push(assistantMsg)
      newMessages.push(assistantMsg)

      // If no tool calls, we're done
      if (toolCallsToExecute.length === 0) {
        callbacks.onDone()
        return newMessages
      }

      // Execute tool calls
      for (const tc of toolCallsToExecute) {
        callbacks.onToolCall(tc.function.name, tc.function.arguments)

        const result = await this.executeTool(tc)

        callbacks.onToolResult(tc.function.name, result)

        const toolResultMsg: ChatMessage = {
          role: 'tool',
          tool_call_id: tc.id,
          content: result.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('\n'),
        }
        messages.push(toolResultMsg)
        newMessages.push(toolResultMsg)
      }
    }

    callbacks.onDone()
    return newMessages
  }

  private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.registry.get(toolCall.function.name)
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolCall.function.name}` }],
        isError: true,
      }
    }

    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const tabId = activeTab?.id
    if (!tabId) {
      return {
        content: [{ type: 'text', text: 'No active tab found' }],
        isError: true,
      }
    }

    const ctx = { cdp: this.cdp, tabId }
    const response = new ToolResponse()

    try {
      const args = JSON.parse(toolCall.function.arguments)
      await tool.handler(args, ctx, response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      response.error(`Tool error: ${msg}`)
    }

    return response.toResult()
  }
}

// Helper to convert Zod schema to JSON Schema (simplified)
function zodToJsonSchema(schema: unknown): Record<string, unknown> {
  const z = require('zod')
  if (!(schema instanceof z.ZodObject)) return { type: 'object', properties: {} }

  const shape = schema.shape
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const [key, value] of Object.entries(shape)) {
    const field = value as z.ZodType
    if (field instanceof z.ZodString) properties[key] = { type: 'string' }
    else if (field instanceof z.ZodNumber) properties[key] = { type: 'number' }
    else if (field instanceof z.ZodBoolean) properties[key] = { type: 'boolean' }
    else properties[key] = { type: 'string' }

    if (!field.isOptional()) required.push(key)
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 && { required }),
  }
}
```

- [ ] **Step 3: Verify types compile**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension
bunx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add extension/core/agent/
git commit -m "feat: implement agent loop with tool execution and system prompt"
```

---

## Task 11: Storage + Config + Messaging

**Files:**
- Create: `extension/lib/storage.ts`
- Create: `extension/lib/config.ts`
- Create: `extension/lib/messaging.ts`

- [ ] **Step 1: Storage wrapper**

```typescript
// extension/lib/storage.ts
import type { Conversation, StorageConfig } from '../core/types'

const DEFAULT_CONFIG: StorageConfig = {
  endpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
}

export async function getConfig(): Promise<StorageConfig> {
  const result = await chrome.storage.local.get('config')
  return { ...DEFAULT_CONFIG, ...result.config }
}

export async function setConfig(config: Partial<StorageConfig>): Promise<void> {
  const current = await getConfig()
  await chrome.storage.local.set({ config: { ...current, ...config } })
}

export async function getConversations(): Promise<Conversation[]> {
  const result = await chrome.storage.local.get('conversations')
  return result.conversations || []
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const conversations = await getConversations()
  const index = conversations.findIndex((c) => c.id === conversation.id)
  if (index >= 0) {
    conversations[index] = conversation
  } else {
    conversations.unshift(conversation)
  }
  // Keep last 50 conversations
  await chrome.storage.local.set({ conversations: conversations.slice(0, 50) })
}

export async function deleteConversation(id: string): Promise<void> {
  const conversations = await getConversations()
  await chrome.storage.local.set({
    conversations: conversations.filter((c) => c.id !== id),
  })
}
```

- [ ] **Step 2: Messaging helpers**

```typescript
// extension/lib/messaging.ts
import type { ExtensionMessage } from '../core/types'

export function sendMessage(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message)
}

export function onMessage(
  callback: (message: ExtensionMessage, sender: chrome.runtime.MessageSender) => void,
): void {
  chrome.runtime.onMessage.addListener(callback)
}

export function sendMessageToTab(tabId: number, message: ExtensionMessage): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, message)
}
```

- [ ] **Step 3: Commit**

```bash
git add extension/lib/
git commit -m "feat: add storage, config, and messaging helpers"
```

---

## Task 12: Sidepanel UI

**Files:**
- Create: `extension/entrypoints/sidepanel/index.html`
- Create: `extension/entrypoints/sidepanel/main.tsx`
- Create: `extension/entrypoints/sidepanel/App.tsx`
- Create: `extension/ui/components/ChatLayout.tsx`
- Create: `extension/ui/components/ChatMessages.tsx`
- Create: `extension/ui/components/ChatMessage.tsx`
- Create: `extension/ui/components/ChatInput.tsx`
- Create: `extension/ui/components/ToolResult.tsx`
- Create: `extension/ui/hooks/useChat.ts`

- [ ] **Step 1: Sidepanel HTML + mount**

```html
<!-- extension/entrypoints/sidepanel/index.html -->
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

```tsx
// extension/entrypoints/sidepanel/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 2: Chat hook**

```typescript
// extension/ui/hooks/useChat.ts
import { useCallback, useRef, useState } from 'react'
import type { ChatMessage, ToolCall, ToolResult } from '../../core/types'

export interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentToolCall: { name: string; args: string } | null
  error: string | null
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentToolCall, setCurrentToolCall] = useState<{ name: string; args: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    setIsStreaming(true)
    setError(null)
    setCurrentToolCall(null)

    // Add user message immediately
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])

    // Create assistant message placeholder
    let assistantContent = ''
    const toolMessages: ChatMessage[] = []

    abortRef.current = new AbortController()

    try {
      await chrome.runtime.sendMessage({
        type: 'chat:send',
        text,
        history: messages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [messages, isStreaming])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setCurrentToolCall(null)
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentToolCall(null)
  }, [])

  // Listen for messages from background
  const handleBackgroundMessage = useCallback((msg: { type: string; [key: string]: unknown }) => {
    switch (msg.type) {
      case 'chat:stream':
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + (msg.chunk as string) },
            ]
          }
          return [...prev, { role: 'assistant' as const, content: msg.chunk as string }]
        })
        break
      case 'chat:tool_call':
        setCurrentToolCall({ name: msg.name as string, args: msg.args as string })
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant' as const,
            content: '',
            tool_calls: [{ id: '', type: 'function' as const, function: { name: msg.name as string, arguments: msg.args as string } }],
          },
        ])
        break
      case 'chat:tool_result':
        setCurrentToolCall(null)
        setMessages((prev) => [
          ...prev,
          { role: 'tool' as const, content: JSON.stringify(msg.result), tool_call_id: '' },
        ])
        break
      case 'chat:done':
        setIsStreaming(false)
        setCurrentToolCall(null)
        break
      case 'chat:error':
        setError(msg.error as string)
        setIsStreaming(false)
        setCurrentToolCall(null)
        break
    }
  }, [])

  return {
    messages,
    isStreaming,
    currentToolCall,
    error,
    sendMessage,
    stop,
    clear,
    handleBackgroundMessage,
  }
}
```

- [ ] **Step 3: Chat UI components**

```tsx
// extension/ui/components/ChatMessage.tsx
import type { ChatMessage as ChatMessageType } from '../../core/types'

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'

  if (isTool) {
    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-[80%] rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
          <span className="font-semibold">Tool Result:</span>{' '}
          {message.content.length > 300
            ? message.content.slice(0, 300) + '...'
            : message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {message.content || '(thinking...)'}
      </div>
    </div>
  )
}
```

```tsx
// extension/ui/components/ChatMessages.tsx
import type { ChatMessage as ChatMessageType } from '../../core/types'
import { ChatMessage } from './ChatMessage'

interface Props {
  messages: ChatMessageType[]
}

export function ChatMessages({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Ask me anything — I can control your browser.
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}
    </div>
  )
}
```

```tsx
// extension/ui/components/ChatInput.tsx
import { useState } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  onStop: () => void
  isStreaming: boolean
}

export function ChatInput({ onSend, disabled, onStop, isStreaming }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        disabled={disabled}
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Send
        </button>
      )}
    </form>
  )
}
```

```tsx
// extension/ui/components/ToolResult.tsx
interface Props {
  name: string
  args: string
}

export function ToolResult({ name, args }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground bg-muted/30">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <span>Executing <strong>{name}</strong>...</span>
    </div>
  )
}
```

```tsx
// extension/ui/components/ChatLayout.tsx
import type { ChatMessage } from '../../core/types'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { ToolResult } from './ToolResult'

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
  currentToolCall: { name: string; args: string } | null
  error: string | null
  onSend: (text: string) => void
  onStop: () => void
  onClear: () => void
}

export function ChatLayout({
  messages,
  isStreaming,
  currentToolCall,
  error,
  onSend,
  onStop,
  onClear,
}: Props) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold">Open Agent</h1>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} />

      {/* Tool execution indicator */}
      {currentToolCall && (
        <ToolResult name={currentToolCall.name} args={currentToolCall.args} />
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        disabled={false}
        isStreaming={isStreaming}
      />
    </div>
  )
}
```

- [ ] **Step 4: App component**

```tsx
// extension/entrypoints/sidepanel/App.tsx
import { useEffect } from 'react'
import { ChatLayout } from '../../ui/components/ChatLayout'
import { useChat } from '../../ui/hooks/useChat'

export function App() {
  const {
    messages,
    isStreaming,
    currentToolCall,
    error,
    sendMessage,
    stop,
    clear,
    handleBackgroundMessage,
  } = useChat()

  useEffect(() => {
    const listener = (msg: { type: string; [key: string]: unknown }) => {
      handleBackgroundMessage(msg)
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [handleBackgroundMessage])

  return (
    <ChatLayout
      messages={messages}
      isStreaming={isStreaming}
      currentToolCall={currentToolCall}
      error={error}
      onSend={sendMessage}
      onStop={stop}
      onClear={clear}
    />
  )
}
```

- [ ] **Step 5: Add CSS**

```css
/* extension/entrypoints/sidepanel/styles.css */
@import "tailwindcss";

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

- [ ] **Step 6: Commit**

```bash
git add extension/entrypoints/sidepanel/ extension/ui/
git commit -m "feat: add sidepanel chat UI with messages, input, and tool display"
```

---

## Task 13: Background Service Worker

**Files:**
- Create: `extension/entrypoints/background.ts`

- [ ] **Step 1: Implement background entry**

```typescript
// extension/entrypoints/background.ts
import { AgentLoop } from '../core/agent/loop'
import { getConfig } from '../lib/storage'
import type { ChatMessage, ExtensionMessage } from '../core/types'

let agent: AgentLoop | null = null

async function getAgent(): Promise<AgentLoop> {
  if (!agent) {
    const config = await getConfig()
    if (!config.apiKey) {
      throw new Error('API key not configured. Open settings to set your API key.')
    }
    agent = new AgentLoop(config)
  }
  return agent
}

// Handle messages from UI
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'chat:send') {
      handleChatMessage(message.text, message.history || [])
      sendResponse({ ok: true })
    }
    return true // Keep message channel open
  },
)

async function handleChatMessage(text: string, history: ChatMessage[]) {
  try {
    const agentLoop = await getAgent()

    await agentLoop.run(text, history, {
      onStream: (chunk) => {
        chrome.runtime.sendMessage({ type: 'chat:stream', chunk })
      },
      onToolCall: (name, args) => {
        chrome.runtime.sendMessage({ type: 'chat:tool_call', name, args })
      },
      onToolResult: (name, result) => {
        chrome.runtime.sendMessage({ type: 'chat:tool_result', name, result })
      },
      onDone: () => {
        chrome.runtime.sendMessage({ type: 'chat:done' })
      },
      onError: (error) => {
        chrome.runtime.sendMessage({ type: 'chat:error', error })
      },
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    chrome.runtime.sendMessage({ type: 'chat:error', error })
  }
}

// Open sidepanel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Reset agent when config changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.config) {
    agent = null
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add extension/entrypoints/background.ts
git commit -m "feat: add background service worker with agent loop integration"
```

---

## Task 14: Integration Test

**Files:**
- Modify: `extension/package.json` (add build script if needed)

- [ ] **Step 1: Build the extension**

```bash
cd E:/AProject/TianX/Personal/Open-Agent-in-Browser/extension
bun run build
```

Expected: Build succeeds, `dist/` directory created with `manifest.json`.

- [ ] **Step 2: Load in Chrome**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/chrome-mv3-dev` (dev build) or `extension/.output/chrome-mv3` (prod build)

- [ ] **Step 3: Configure**

1. Right-click extension icon → "Options" (or click the icon to open sidepanel)
2. Enter API endpoint, API key, model name
3. Save

- [ ] **Step 4: Test sidepanel**

1. Click extension icon → sidepanel opens
2. Type "What page am I on?"
3. Expected: Agent calls `list_pages` tool and responds with current tab info

- [ ] **Step 5: Test navigation**

1. Type "Navigate to example.com"
2. Expected: Agent calls `navigate` tool, browser navigates, agent confirms

- [ ] **Step 6: Test screenshot**

1. Type "Take a screenshot of this page"
2. Expected: Agent calls `take_screenshot`, image appears in chat

- [ ] **Step 7: Commit final state**

```bash
git add -A
git commit -m "feat: complete Phase 1 — chrome extension agent with 10 core tools"
```

---

## Summary

**Phase 1 delivers:**
- WXT + React Chrome extension
- Sidepanel chat UI
- OpenAI Compatible LLM provider (BYOK)
- Agent loop with tool execution
- CDP client wrapping `chrome.debugger`
- 10 core tools: navigate, list_pages, new_page, close_page, go_back, go_forward, reload, take_screenshot, take_snapshot, get_page_content, evaluate_script, click, fill, hover, scroll

**Next steps (Phase 2):**
- New Tab, Popup, Options pages
- Remaining 40+ tools (bookmarks, history, windows, tab groups, downloads)
- Tool enable/disable settings
- Conversation persistence
