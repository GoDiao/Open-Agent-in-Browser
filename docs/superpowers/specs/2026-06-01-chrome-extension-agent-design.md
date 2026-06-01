# Open-Agent-in-Browser: Chrome Extension Agent Design Spec

## Overview

A Chrome extension that integrates an AI Agent natively into the browser. Inspired by [BrowserOS](https://github.com/browseros-ai/BrowserOS), but built as a lightweight extension rather than a Chromium fork.

**Core value**: BYOK (Bring Your Own Key), OpenAI Compatible API with custom endpoint, full browser automation via 53+ tools.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Chrome Extension                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Sidepanel │  │ New Tab  │  │    Popup      │  │
│  │  (Chat)   │  │  (Home)  │  │  (Quick)      │  │
│  └─────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│        │              │               │           │
│        └──────────────┼───────────────┘           │
│                       │                           │
│              ┌────────▼────────┐                  │
│              │   Agent Core    │                  │
│              │  (Background SW)│                  │
│              │                 │                  │
│              │  ┌───────────┐  │                  │
│              │  │ Tool Loop │  │                  │
│              │  │ (OpenAI   │  │                  │
│              │  │  Compat)  │  │                  │
│              │  └─────┬─────┘  │                  │
│              │        │        │                  │
│              │  ┌─────▼─────┐  │                  │
│              │  │ Tool Reg  │  │                  │
│              │  │ 53+ tools │  │                  │
│              │  └─────┬─────┘  │                  │
│              └────────┼────────┘                  │
│                       │                           │
│              ┌────────▼────────┐                  │
│              │  chrome.debugger│                  │
│              │  (CDP Protocol) │                  │
│              └─────────────────┘                  │
└─────────────────────────────────────────────────┘
                       │
                       ▼ CDP
              ┌─────────────────┐
              │    Chromium      │
              │    Browser       │
              └─────────────────┘
```

Communication:
- UI ↔ Background: `chrome.runtime.sendMessage`
- Background ↔ Browser: `chrome.debugger` API (CDP protocol)
- Background ↔ LLM: OpenAI Compatible HTTP API (`POST /v1/chat/completions`)

## Tech Stack

- **Framework**: WXT (extension framework with HMR)
- **UI**: React + Tailwind CSS + Shadcn UI
- **Language**: TypeScript
- **Package Manager**: Bun
- **Validation**: Zod

## Project Structure

```
Open-Agent-in-Browser/
├── _reference/BrowserOS/          # Reference code (not committed)
├── extension/                     # WXT extension project
│   ├── wxt.config.ts
│   ├── package.json
│   ├── entrypoints/
│   │   ├── background.ts          # Service Worker — Agent core
│   │   ├── sidepanel/             # Chat UI
│   │   ├── newtab/                # Home page
│   │   ├── popup/                 # Quick actions popup
│   │   └── options/               # Settings page
│   ├── core/
│   │   ├── agent/                 # Agent loop
│   │   │   ├── loop.ts            # Main tool call loop
│   │   │   ├── provider.ts        # OpenAI Compatible client
│   │   │   ├── prompt.ts          # System prompt builder
│   │   │   └── compaction.ts      # Context compression
│   │   ├── tools/                 # Tool registry + definitions
│   │   │   ├── registry.ts        # ToolRegistry
│   │   │   ├── framework.ts       # defineTool + types
│   │   │   ├── navigation.ts      # Navigation, tabs
│   │   │   ├── input.ts           # Click, type, form
│   │   │   ├── snapshot.ts        # Screenshot, DOM, page content
│   │   │   ├── dom.ts             # DOM queries
│   │   │   ├── bookmarks.ts       # Bookmarks CRUD
│   │   │   ├── history.ts         # History search
│   │   │   ├── console.ts         # Console logs
│   │   │   ├── windows.ts         # Window management
│   │   │   ├── tab-groups.ts      # Tab groups
│   │   │   ├── downloads.ts       # Downloads, PDF, screenshots
│   │   │   └── filesystem.ts      # File ops (Phase 3, server)
│   │   └── cdp/                   # CDP protocol layer
│   │       ├── client.ts          # chrome.debugger wrapper
│   │       ├── protocol.ts        # CDP type bindings (from BrowserOS)
│   │       └── domains/           # CDP domain wrappers
│   │           ├── page.ts
│   │           ├── dom.ts
│   │           ├── input.ts
│   │           ├── network.ts
│   │           └── runtime.ts
│   ├── ui/                        # Shared UI components
│   │   ├── components/            # Reuse BrowserOS ai-elements patterns
│   │   │   ├── chat/              # ChatMessages, ChatFooter, ChatHeader
│   │   │   ├── message.tsx        # Message bubble
│   │   │   ├── tool-result.tsx    # Tool execution display
│   │   │   ├── code-block.tsx     # Code rendering
│   │   │   ├── screenshot.tsx     # Inline screenshot
│   │   │   ├── prompt-input.tsx   # Input with suggestions
│   │   │   └── suggestion.tsx     # Quick action suggestions
│   │   ├── hooks/
│   │   └── styles/
│   ├── lib/
│   │   ├── storage.ts             # chrome.storage wrapper
│   │   ├── messaging.ts           # Message passing
│   │   └── config.ts              # Config management
│   └── assets/
├── docs/
│   └── superpowers/specs/         # Design docs
└── package.json                   # Root monorepo (optional)
```

Key decisions:
- **`core/` vs `entrypoints/` separation**: core is pure logic, entrypoints are WXT entry points
- **`core/tools/`**: one file per tool group, aligned with BrowserOS for easy reuse
- **`core/cdp/`**: wraps `chrome.debugger`, exposes clean API to tools

## LLM Provider

BYOK with OpenAI Compatible API:

```typescript
interface LLMConfig {
  endpoint: string    // Custom URL, e.g. http://localhost:11434/v1
  apiKey: string      // User's API key
  model: string       // Model name
}

// Standard OpenAI Compatible format
POST {endpoint}/chat/completions
{
  model: "gpt-4o",
  messages: [...],
  tools: [...],       // 53+ tools as JSON Schema
  stream: true
}
```

Supports: OpenAI, Claude (via proxy), Ollama, LM Studio, any OpenAI-compatible provider.

## Tool System

Aligned with BrowserOS's `defineTool` pattern:

```typescript
interface ToolDefinition {
  name: string              // e.g. "navigate", "click", "take_screenshot"
  description: string       // For LLM
  input: ZodSchema          // Zod validation
  handler: ToolHandler      // Execution logic
}

type ToolHandler = (args: unknown, ctx: ToolContext) => Promise<ToolResult>

interface ToolContext {
  cdp: CDPClient            // chrome.debugger wrapper
  tabId?: number            // Active tab
  config: AgentConfig       // User config
}
```

### Tool Inventory (53+ tools)

| Group | Tools | Source API |
|-------|-------|------------|
| **Navigation** | `navigate`, `new_page`, `close_page`, `list_pages`, `go_back`, `go_forward`, `reload`, `get_active_page`, `focus_page`, `wait_for` | CDP Page |
| **Input** | `click`, `click_at`, `fill`, `type_at`, `press_key`, `hover`, `hover_at`, `scroll`, `select_option`, `check`, `uncheck`, `drag`, `drag_at`, `upload_file`, `handle_dialog` | CDP Input |
| **Snapshot** | `take_screenshot`, `take_snapshot`, `take_enhanced_snapshot`, `get_page_content`, `get_page_links`, `evaluate_script` | CDP Page/DOM/Runtime |
| **DOM** | `get_dom`, `search_dom` | CDP DOM |
| **Console** | `get_console_logs` | CDP Console |
| **Bookmarks** | `create_bookmark`, `search_bookmarks`, `get_bookmarks`, `update_bookmark`, `remove_bookmark`, `move_bookmark` | chrome.bookmarks |
| **History** | `search_history`, `get_recent_history`, `delete_history_url`, `delete_history_range` | chrome.history |
| **Windows** | `list_windows`, `create_window`, `close_window`, `focus_window` | chrome.windows |
| **Tab Groups** | `create_tab_group`, `list_tab_groups`, `close_tab_group` | chrome.tabGroups |
| **Downloads** | `download_file`, `save_pdf`, `save_screenshot` | chrome.downloads + CDP |
| **Page Actions** | `get_element_properties`, `focus_element` | CDP DOM |

### Chrome API Capability Mapping

All 53+ tools are achievable in pure extension mode:

| CDP Domain | Capability | Supported |
|------------|------------|-----------|
| Page | Navigate, screenshot, PDF, lifecycle | ✅ |
| DOM | Query, modify, search, highlight | ✅ |
| Input | Click, type, drag, touch | ✅ |
| Runtime | Execute JS, get return values | ✅ |
| Network | Intercept, inspect requests | ✅ |
| Console | Log capture | ✅ |
| Emulation | Device, geolocation, timezone | ✅ |
| Browser | Window management | ✅ |

Extension-only APIs also supported: `chrome.bookmarks`, `chrome.history`, `chrome.tabGroups`, `chrome.downloads`.

### Limitations

1. **Service Worker lifecycle** — 5 min timeout; long tasks need chunking or `chrome.alarms`
2. **`chrome.debugger` authorization** — user prompt on first attach per tab
3. **Cannot debug self** — extension cannot debug its own pages
4. **Single debugger per tab** — one attach per tab at a time

## Agent Loop

```
User message
    │
    ▼
┌──────────────────┐
│  Build Messages   │  ← system prompt + history + new message
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Call LLM API    │  ← OpenAI Compatible (custom endpoint)
│  POST /v1/chat   │
└────────┬─────────┘
         │
         ▼
    ┌────┴────┐
    │ tool    │──yes──▶ Execute tool → Add result to messages → Back to LLM
    │ call?   │
    └────┬────┘
         │ no
         ▼
    Stream output to UI
```

**System Prompt**: Tells the LLM it's a browser agent, lists available tools, provides current page context (URL, title, accessibility snapshot).

**Compaction**: When conversation gets too long, summarize history with the LLM itself, preserving key info. Reference: BrowserOS `compaction.ts`.

**Streaming**: `stream: true`, push chunks to sidepanel via `chrome.runtime.sendMessage`.

## UI Design

### Four Entry Points

| Entry | Purpose | Interaction |
|-------|---------|-------------|
| **Sidepanel** | Main chat, persistent right panel | Full conversation, tool execution status, page context |
| **New Tab** | Home page replacement | Quick action cards, recent conversations, page summary |
| **Popup** | Quick actions | Simple Q&A, one-click screenshot/summary, open sidepanel |
| **Options** | Settings | API endpoint, API key, model, tool toggles, theme |

### Sidepanel Layout

```
┌─────────────────────────────┐
│  Open Agent    [Settings][Clear] │  ← Header
├─────────────────────────────┤
│                             │
│  🤖 I can help operate      │  ← Messages area
│     your browser            │
│                             │
│  👤 Search for xxx          │
│                             │
│  🤖 [Executing search...]   │  ← Tool execution status
│     [Screenshot preview]    │  ← Inline screenshot
│     Search results below... │
│                             │
├─────────────────────────────┤
│  [📎] Type a message... [Send] │  ← Input area
│  Current page: example.com  │  ← Page context hint
└─────────────────────────────┘
```

### UI Patterns (from BrowserOS)

- **ChatLayout**: `ChatSessionProvider` wrapping global state, `ChatHeader` + `Outlet`
- **ChatSessionContext**: Central state for chat sessions (messages, status, provider)
- **AI Elements**: `message.tsx`, `tool.tsx`, `code-block.tsx`, `image.tsx`, `chain-of-thought.tsx`, `suggestion.tsx`, `prompt-input.tsx`
- **UI Framework**: Shadcn UI + Tailwind CSS
- **Message types**: text, tool_call, tool_result, image (screenshot)

### Communication Flow

```
Sidepanel ──sendMessage──▶ Background (Agent Core)
                              │
                              ├── stream chunks ──▶ Sidepanel
                              └── tool results ──▶ Sidepanel
```

## Data Storage

```typescript
// chrome.storage.local — persistent
interface StorageSchema {
  config: {
    endpoint: string        // LLM API endpoint
    apiKey: string          // Encrypted storage
    model: string           // Model name
    theme: 'light' | 'dark' | 'system'
  }
  conversations: Conversation[]
  toolSettings: Record<string, { enabled: boolean }>
}

// chrome.storage.session — session-scoped (cleared on SW restart)
interface SessionSchema {
  currentConversationId: string
  agentState: 'idle' | 'streaming' | 'executing'
}
```

No external database needed. `chrome.storage.local` provides 10MB+ storage.

## Phased Roadmap

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **Phase 1** | Extension skeleton: WXT + React, sidepanel chat, Agent loop, CDP client, 10 core tools | Minimal runnable extension |
| **Phase 2** | Full 53+ tools, New Tab, Popup, Options page | Feature-complete extension |
| **Phase 3** | Local Server (Bun/Node), filesystem tools, MCP Server endpoint | Extension + Server hybrid |

### Phase 1 Core Tools (10)

1. `navigate` — go to URL
2. `take_screenshot` — capture page
3. `take_snapshot` — accessibility tree
4. `click` — click element
5. `fill` — fill input field
6. `evaluate_script` — run JS
7. `list_pages` — list open tabs
8. `new_page` — open new tab
9. `close_page` — close tab
10. `get_page_content` — extract text content

## Non-Goals (for now)

- OAuth login to third-party services
- Cloud sync
- Visual workflow builder
- Scheduled tasks
- SOUL.md personality system

These can be added in future iterations.
