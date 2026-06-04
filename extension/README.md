# Iris — AI Personal Assistant for Chrome

<p align="center">
  <img src=".github/icon.png" alt="Iris Logo" width="128" height="128" />
</p>

<p align="center">
  <a href="https://github.com/iris-agent/iris/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Chrome-MV3-blue.svg" alt="Chrome MV3" />
  </a>
</p>

Iris is a Chrome extension that brings a persistent AI assistant directly into your browser. It acts as your personal browser companion—remembering context, executing tasks, and automating workflows through natural conversation.

## Features

### 🤖 AI-Powered Browser Assistant
- **Conversational Interface**: Chat with an AI agent directly in your browser's sidepanel
- **Persistent Memory**: Remembers your preferences, context, and notes across sessions
- **Customizable Personality**: Configure your AI assistant's tone and behavior via SOUL.md

### 🛠️ Powerful Browser Automation
- **DOM Inspection**: Query and interact with any page's DOM elements
- **Network Control**: Block requests, mock responses, set network conditions
- **Input Automation**: Type, click, scroll, and navigate programmatically
- **Console Access**: Read and inject JavaScript into any page

### 📋 Intelligent Features
- **Smart Scheduling**: Set recurring tasks and reminders
- **Profile Management**: Switch between different AI behavior profiles
- **Conversation History**: Search and revisit past interactions
- **Memory Extraction**: Automatic context extraction after conversations

### 🔌 Extensible
- **OpenAI Compatible**: Works with OpenAI, Anthropic, Ollama, or any OpenAI-compatible API
- **Tool System**: 60+ built-in tools for browser automation
- **Developer Friendly**: Full CDP (Chrome DevTools Protocol) access

## Quick Start

### 1. Install the Extension

```bash
# Clone the repository
git clone https://github.com/iris-agent/iris.git
cd iris/extension

# Install dependencies
bun install

# Build the extension
bun run build
```

### 2. Load into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/.output/chrome-mv3` directory

### 3. Configure Your LLM

1. Open Iris sidepanel (click the extension icon or use the sidepanel)
2. Go to **Settings** (gear icon)
3. Enter your API key and select a provider:
   - **OpenAI**: `https://api.openai.com/v1`
   - **Anthropic**: `https://api.anthropic.com/v1`
   - **Ollama**: `http://localhost:11434/v1`
   - **Custom**: Any OpenAI-compatible endpoint

### 4. Start Using

- **Open Sidepanel**: Click the extension icon or press the keyboard shortcut
- **New Tab**: Your custom new tab page with search and agent mode
- **Chat**: Just start typing—Iris can help with browsing tasks, research, and more

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
├─────────────────────────────────────────────────────────────────┤
│  Sidepanel (React SPA)                                          │
│  ├── Chat Interface                                             │
│  ├── Memory Panel                                               │
│  ├── SOUL Configuration                                         │
│  ├── Settings & Profiles                                        │
│  └── Scheduler                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Background Service Worker                                      │
│  ├── Agent Loop (LLM orchestration)                             │
│  ├── CDP Client (browser automation)                            │
│  ├── Memory Management                                          │
│  └── Task Scheduler                                             │
├─────────────────────────────────────────────────────────────────┤
│  Content Scripts                                                │
│  ├── Text Selection Capture                                     │
│  ├── Network Request Tracking                                   │
│  └── Visual Glow Overlay                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Description |
|-----------|-------------|
| **Agent Loop** | Orchestrates LLM calls, tool execution, and response streaming |
| **CDP Client** | Wraps Chrome DevTools Protocol for full browser control |
| **Tool System** | 60+ tools defined with Zod schemas, registered in the agent loop |
| **Memory Store** | Persistent user profile and notes with frozen snapshot pattern |
| **Soul Store** | AI personality configuration (personality, style, boundaries) |

### Key Files

- `entrypoints/background.ts` — Service worker with AgentLoop
- `entrypoints/sidepanel/` — React UI application
- `core/agent/loop.ts` — Main agent orchestration
- `core/cdp/` — Chrome DevTools Protocol wrappers
- `core/tools/` — Tool definitions (60+ tools)
- `lib/memory.ts` — Persistent memory system

## Supported LLM Providers

| Provider | Endpoint | Notes |
|----------|----------|-------|
| OpenAI | `https://api.openai.com/v1` | GPT-4o, GPT-4o Mini |
| Anthropic | `https://api.anthropic.com/v1` | Claude 4 models |
| Ollama | `http://localhost:11434/v1` | Local models |
| Custom | Any OpenAI-compatible | Self-hosted, proxies |

## Permissions

Iris requires the following permissions:

- `debugger` — Full CDP access for browser automation
- `storage` — Local data persistence
- `tabs` — Tab management
- `bookmarks` — Bookmark read/write
- `history` — History access
- `downloads` — Download management
- `alarms` — Scheduled tasks
- `sidePanel` — Sidepanel UI
- `<all_urls>` — Access all websites for automation

See [PERMISSIONS.md](PERMISSIONS.md) for detailed explanations.

## Documentation

- [Configuration Guide](README.md#supported-llm-providers) — LLM provider setup
- [Security Considerations](SECURITY.md) — API key handling and data storage
- [Permissions Reference](PERMISSIONS.md) — Permission explanations
- [Contributing Guide](CONTRIBUTING.md) — Development setup

## Tech Stack

- **Framework**: WXT (Chrome Extension SDK)
- **UI**: React 19, Tailwind CSS 4
- **Validation**: Zod 4
- **Language**: TypeScript
- **Runtime**: Chrome MV3 Service Worker

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for browser automation
</p>