# Getting Started with Iris

This guide will walk you through setting up and using Iris.

## Prerequisites

- Chrome or Chromium-based browser (Chrome, Edge, Brave, etc.)
- An API key from an LLM provider (OpenAI, Anthropic, or local Ollama)

## Installation

### 1. Clone and Build

```bash
git clone https://github.com/iris-agent/iris.git
cd iris/extension
bun install
bun run build
```

### 2. Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Navigate to `iris/extension/.output/chrome-mv3` and select it

### 3. First Setup

1. Click the Iris extension icon to open the sidepanel
2. Complete the onboarding flow
3. Enter your API key in Settings

## Configuration

### Setting Up Your LLM Provider

#### OpenAI
- Endpoint: `https://api.openai.com/v1`
- Model: `gpt-4o` or `gpt-4o-mini`
- Get API key from: https://platform.openai.com/api-keys

#### Anthropic
- Endpoint: `https://api.anthropic.com/v1`
- Model: `claude-sonnet-4-6` or `claude-haiku-4-5`
- Get API key from: https://console.anthropic.com/

#### Ollama (Local)
- Endpoint: `http://localhost:11434/v1`
- Model: Any model you've downloaded (e.g., `llama3`, `qwen2`)
- Install from: https://ollama.ai/

## Using Iris

### Basic Interaction

1. Navigate to any webpage
2. Open the Iris sidepanel
3. Type a command or question in natural language

Example commands:
- "Take a screenshot of this page"
- "What's the title of this page?"
- "Click the login button"
- "Summarize the page content"

### Memory System

Iris has two types of memory:

1. **User Profile** (`Ctrl+M` → User tab): Your personal info (name, role, timezone)
2. **Notes** (`Ctrl+M` → Notes tab): Context Iris should remember across sessions

### SOUL Configuration

Customize Iris's personality:
- **Personality**: How Iris describes itself
- **Communication Style**: Preferred response format
- **Boundaries**: What Iris should avoid
- **Preferences**: Task execution preferences

## Troubleshooting

### Extension Not Loading
- Make sure you're in Chrome (or Chromium-based browser)
- Check that Developer mode is enabled
- Try reloading the unpacked extension

### API Errors
- Verify your API key is correct
- Check that your account has credits/API access
- For Ollama, ensure the service is running locally

### Tool Execution Fails
- Some tools require the active tab to have completed loading
- Check the console for error messages
- Try reloading the page and retrying

## Next Steps

- Read the [Architecture](architecture.md) guide for deeper understanding
- Check the [Tools Reference](tools-reference.md) for all available commands
- Review [API Configuration](api-config.md) for advanced provider setup