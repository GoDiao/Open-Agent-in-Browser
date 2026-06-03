# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Start WXT dev server (Chrome) |
| `bun run build` | Production build (Chrome) |
| `bun run compile` | TypeScript type-check (`tsc --noEmit`) |
| `bun run zip` | Package extension as .zip |

All commands run from the `extension/` directory.

## Architecture

Iris is a Chrome MV3 sidepanel extension that acts as a browser personal assistant with persistent memory. Built with WXT, React 19, Tailwind CSS 4, and Zod 4.

### Entrypoints (WXT convention, `entrypoints/`)

- **`background.ts`** — Service worker. Owns the `AgentLoop`, handles `chat:send` from sidepanel, relays stream/tool events back via `chrome.runtime.sendMessage`, runs scheduled tasks via `chrome.alarms`. Calls `loadMemory()` before each agent run.
- **`sidepanel/`** — Main UI. React SPA with chat, settings, memory panel, scheduler, profiles, conversations. Calls `loadMemory()` at mount.
- **`content.ts`** — Captures text selection on mouseup into `chrome.storage.local`.
- **`glow.content.ts`** — Visual glow overlay during active agent runs.
- **`popup/`**, **`newtab/`** — Quick launch and new tab override with search/agent mode toggle.

### Core (`core/`)

- **`agent/loop.ts`** — `AgentLoop`: build system prompt → call LLM → parse streaming response → execute tool calls → loop (max 20 iterations).
- **`agent/provider.ts`** — OpenAI-compatible SSE streaming client.
- **`agent/prompt.ts`** — System prompt builder. Includes tool list, active tab context, memory snapshot, cold-start profile questions (tiered by completeness).
- **`agent/compaction.ts`** — Smart conversation compaction when messages exceed threshold.
- **`agent/memory-review.ts`** — Post-conversation memory extraction. Debounced 30s after last turn.
- **`cdp/`** — Chrome DevTools Protocol client wrapping `chrome.debugger` API. Domain modules: page, dom, input, network, storage, emulation, console, runtime.
- **`tools/`** — 66 tools defined with `defineTool({name, description, input: z.ZodType, handler})`. Registered in `loop.ts`. `toolToJsonSchema()` converts Zod to OpenAI function-calling format.
- **`types.ts`** — Shared types: `ToolDefinition`, `ToolContext`, `ToolResponse`, `ChatMessage`, `LLMConfig`, `ExtensionMessage`.

### Lib (`lib/`)

- **`memory.ts`** — Two-target memory: `user` (profile, 5000 chars) + `memory` (notes, 8000 chars). Entries delimited by `§`. Structured user fields (name, nickname, email, timezone, language, role). Frozen snapshot pattern for system prompt. `ensureLoaded()` lazy-loads from `chrome.storage.local`.
- **`storage.ts`** — `chrome.storage.local` wrappers for config, conversations, theme, selected text.
- **`scheduler.ts`** — Recurring/one-time tasks via `chrome.alarms`.
- **`history.ts`** — Tool execution record persistence (max 200).

### UI (`ui/`)

Components: `ChatLayout`, `ChatMessages`, `ChatInput`, `ChatMessage`, `MemoryPanel`, `AgentProfiles`, `Settings`, `Scheduler`, `ConversationList`, `NewTabPage`, `Onboarding`. Hooks: `useChat.ts`, `useMemory.ts`.

## Key Gotchas

1. **Module isolation**: Background and sidepanel are separate JS contexts. Module-level state (`_memoryEntries`, `_frozenSnapshot`) is NOT shared. `loadMemory()` must be called in each context independently.
2. **Frozen snapshot**: `loadMemory()` captures `_frozenSnapshot` once. System prompt uses this snapshot, not live state. Background calls `loadMemory()` before each `agentLoop.run()`.
3. **Memory tool in background**: `update_memory` tool handlers call `readMemoryFromStorage()` (reads directly from `chrome.storage.local`) because they execute in the background context where module variables may be empty.
4. **Agent loop safety**: Max 20 tool-call iterations. Compaction triggers at >30 non-system messages.
5. **Content script limitations**: Cannot call `chrome.tabs.query` — gets tab ID from background via `get-tab-id` message.
6. **Adding a new tool**: Define with `defineTool()` in `core/tools/`, import and register in `loop.ts`'s `registerTools()`, add to the tools array.
