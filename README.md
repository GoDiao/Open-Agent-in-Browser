# Iris — AI Personal Assistant for Chrome

<p align="center">
  <a href="https://github.com/iris-agent/iris/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Chrome-MV3-blue.svg" alt="Chrome MV3" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Version-0.1.0-purple.svg" alt="Version" />
  </a>
</p>

Iris is a Chrome extension that brings a persistent AI assistant directly into your browser. It acts as your personal browser companion—remembering context, executing tasks, and automating workflows through natural conversation.

## ✨ Features

### 🤖 AI-Powered Browser Assistant
- **Conversational Interface**: Chat with an AI agent directly in your browser's sidepanel
- **Persistent Memory**: Remembers your preferences, context, and notes across sessions
- **Customizable Personality**: Configure your AI assistant's tone and behavior via SOUL

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

## 🚀 Quick Start

### Prerequisites
- Chrome or Chromium-based browser
- [Bun](https://bun.sh) runtime (or npm)

### Installation

```bash
# Clone the repository
git clone https://github.com/iris-agent/iris.git
cd iris

# Install dependencies
cd extension && bun install

# Build the extension
bun run build
```

### Load into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/.output/chrome-mv3` directory

### Configuration

1. Open Iris sidepanel (click the extension icon)
2. Go to **Settings** (gear icon)
3. Enter your API key and select a provider:
   - **OpenAI**: `https://api.openai.com/v1`
   - **Anthropic**: `https://api.anthropic.com/v1`
   - **Ollama**: `http://localhost:11434/v1`
   - **Custom**: Any OpenAI-compatible endpoint

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Detailed setup guide |
| [Architecture](docs/architecture.md) | System design and component overview |
| [Tools Reference](docs/tools-reference.md) | Complete list of 60+ tools |
| [API Configuration](docs/api-config.md) | LLM provider setup guide |
| [Contributing](extension/CONTRIBUTING.md) | Development setup and coding standards |
| [Security](extension/SECURITY.md) | Security considerations and best practices |
| [Permissions](extension/PERMISSIONS.md) | Chrome extension permissions explained |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
├─────────────────────────────────────────────────────────────────┤
│  Sidepanel (React SPA)                                          │
│  ├── Chat Interface                                             │
│  ├── Memory Panel                                               │
│  ├── SOUL Configuration                                         │
│  └── Settings & Profiles                                        │
├─────────────────────────────────────────────────────────────────┤
│  Background Service Worker                                      │
│  ├── Agent Loop (LLM orchestration)                             │
│  ├── CDP Client (browser automation)                            │
│  └── Memory Management                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Description |
|-----------|-------------|
| **Agent Loop** | Orchestrates LLM calls, tool execution, and response streaming |
| **CDP Client** | Wraps Chrome DevTools Protocol for full browser control |
| **Tool System** | 60+ tools defined with Zod schemas |
| **Memory Store** | Persistent user profile and notes |
| **Soul Store** | AI personality configuration |

## 🛠️ Development

```bash
# Start development server
cd extension && bun run dev

# Run tests
bun run test

# Type check
bun run compile

# Production build
bun run build
```

## 📝 License

MIT License — see [LICENSE](extension/LICENSE) for details.

---

<p align="center">
  Built with ❤️ for browser automation
</p>