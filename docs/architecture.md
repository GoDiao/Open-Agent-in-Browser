# Iris Architecture

This document provides an in-depth look at Iris's system design, components, and data flow.

## Overview

Iris is a Chrome MV3 extension that combines a React-based UI with a service worker-powered agent system. It uses the Chrome DevTools Protocol (CDP) for browser automation and supports multiple LLM providers.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
├─────────────────────────────────────────────────────────────────┤
│  Sidepanel (React SPA)                                          │
│  ├── Chat UI (messages, input)                                  │
│  ├── Panels (Memory, SOUL, Settings, Scheduler)                │
│  └── State Management (useChat, useMemory hooks)               │
├─────────────────────────────────────────────────────────────────┤
│  Background Service Worker                                      │
│  ├── AgentLoop (LLM orchestration)                              │
│  ├── CDP Client (browser control)                               │
│  ├── Tool Registry (60+ tools)                                  │
│  └── Memory/Soul Management                                     │
├─────────────────────────────────────────────────────────────────┤
│  Content Scripts                                                │
│  ├── Text Selection Capture                                     │
│  ├── Network Request Tracking                                   │
│  └── Glow Overlay (visual feedback)                             │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    Chrome Runtime
                    (chrome.storage,
                     chrome.debugger,
                     chrome.alarms)
```

## Core Components

### 1. Agent Loop (`core/agent/loop.ts`)

The AgentLoop is the heart of Iris, orchestrating the interaction between the LLM and browser automation.

```
User Message → Build System Prompt → Call LLM → Parse Response → Execute Tools → Loop
```

**Key responsibilities:**
- Build system prompt with memory, SOUL, and context
- Call LLM with OpenAI-compatible SSE streaming
- Parse streaming response for text and tool calls
- Execute tool calls via CDP client
- Manage conversation state and compaction

**Configuration:**
```typescript
interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
  endpoint: string
  apiKey: string
  model: string
}
```

### 2. CDP Client (`core/cdp/`)

The CDP client wraps Chrome DevTools Protocol for full browser control.

**Supported Domains:**

| Domain | Capabilities |
|--------|-------------|
| `Page` | Navigation, screenshot, print |
| `DOM` | Query, highlight, focus elements |
| `Input` | Mouse, keyboard, touch events |
| `Network` | Intercept, block, mock requests |
| `Runtime` | Script injection, console access |
| `Storage` | Local/session storage manipulation |
| `Emulation` | Viewport, timezone, geolocation |

**Usage:**
```typescript
const cdp = new ChromeDebuggerClient()
await cdp.attach(tabId)
await cdp.sendCommand(tabId, 'Page.navigate', { url: 'https://example.com' })
```

### 3. Tool System (`core/tools/`)

Tools are defined using `defineTool()` with Zod schemas for input validation.

**Tool Structure:**
```typescript
export const my_tool = defineTool({
  name: 'my_tool',
  description: 'What the tool does',
  input: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async (args, ctx, response) => {
    // Tool implementation
    response.text('Result message')
  },
})
```

**Tool Context:**
```typescript
interface ToolContext {
  cdp: ChromeDebuggerClient
  tabId: number
  config: AgentConfig
}
```

### 4. Memory System (`lib/memory.ts`)

Persistent memory with two targets:

| Target | Limit | Purpose |
|--------|-------|---------|
| `user` | 5000 chars | User profile (name, role, preferences) |
| `memory` | 8000 chars | Agent notes (facts, lessons, context) |

**Frozen Snapshot Pattern:**
```typescript
// Load memory and capture snapshot
await loadMemory()
const snapshot = getMemorySnapshot()
// Snapshot is used for system prompt (not live state)
```

### 5. SOUL System (`lib/soul.ts`)

AI personality configuration:

```typescript
interface SoulData {
  personality: string      // "Helpful, direct, competent..."
  communicationStyle: string  // "Concise. Use bullet points..."
  boundaries: string[]     // What to avoid
  preferences: string[]    // Task preferences
}
```

## Data Flow

### 1. User Sends Message

```
Sidepanel Input → sendMessage() → chrome.runtime.sendMessage
                                              │
                                              ▼
Background Service Worker ──────────────────────┘
```

### 2. Agent Processing

```
background.ts:onMessage('chat:send')
        │
        ▼
AgentLoop.run(messages)
        │
        ├──▶ buildSystemPrompt() ──▶ memory + soul + context
        │
        ├──▶ provider.chat() ──────▶ LLM API (SSE streaming)
        │
        ├──▶ parseResponse() ──────▶ Extract text + tool_calls
        │
        └──▶ executeTool() ────────▶ CDP Client ──▶ Target Tab
```

### 3. UI Updates

```
Tool Execution ──▶ sendToUI('chat:tool_result')
                            │
                            ▼
              useChat.ts:handleBackgroundMessage()
                            │
                            ▼
              setMessages() ──▶ React re-render
```

## Extension Entrypoints

| File | Purpose |
|------|---------|
| `entrypoints/background.ts` | Service worker, owns AgentLoop |
| `entrypoints/sidepanel/App.tsx` | Main UI, React SPA |
| `entrypoints/content.ts` | Content script, text selection |
| `entrypoints/glow.content.ts` | Visual overlay during agent runs |
| `entrypoints/newtab/` | Custom new tab page |

## Key Patterns

### Module Isolation

Background and sidepanel are separate JavaScript contexts. Shared state must use `chrome.storage.local`:

```typescript
// ❌ Wrong - module variables not shared
let _memoryEntries: string[] = []

// ✅ Correct - use chrome.storage
const result = await chrome.storage.local.get('memoryStore')
```

### Frozen Snapshot

System prompt uses a snapshot captured at load time, not live state:

```typescript
// Captured once at loadMemory()
let _frozenSnapshot = { memory: '', user: '' }

// System prompt uses snapshot
function buildSystemPrompt() {
  return `Memory: ${_frozenSnapshot.memory}`
}
```

### Tool Definition

All tools use Zod for input validation:

```typescript
import { z } from 'zod'
import { defineTool } from './framework'

export const navigate_to_url = defineTool({
  name: 'navigate_to_url',
  description: 'Navigate to a URL',
  input: z.object({
    url: z.string().url().describe('The URL to navigate to'),
  }),
  handler: async (args, ctx, response) => {
    // Implementation
  },
})
```

## Security Considerations

1. **API Keys**: Stored in `chrome.storage.local`, not synced to cloud
2. **Debugger Permission**: Required for CDP, grants full page access
3. **User Consent**: Memory review requires opt-in
4. **Dangerous Actions**: Require confirmation dialog

## Performance

- **Lazy Loading**: Memory and SOUL loaded on-demand
- **Conversation Compaction**: Triggers at 30+ messages
- **Max Tool Calls**: 20 iterations per agent run
- **Storage Limits**: Enforced via char limits

---

*See also: [Tools Reference](tools-reference.md), [API Configuration](api-config.md)*