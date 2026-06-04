# API Configuration Guide

This guide explains how to configure Iris to work with different LLM providers.

## Supported Providers

| Provider | Endpoint | Models |
|----------|----------|--------|
| OpenAI | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Anthropic | `https://api.anthropic.com/v1` | claude-sonnet-4-6, claude-haiku-4-5 |
| Ollama | `http://localhost:11434/v1` | llama3, qwen2, mistral, etc. |
| Custom | Any OpenAI-compatible | Self-hosted, proxies |

---

## OpenAI

### Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open Iris Settings
3. Select **Provider**: OpenAI
4. Enter your API key
5. Choose a model (default: `gpt-4o`)

### Configuration

```json
{
  "provider": "openai",
  "endpoint": "https://api.openai.com/v1",
  "model": "gpt-4o",
  "apiKey": "sk-..."
}
```

### Recommended Models

| Model | Speed | Capability | Best For |
|-------|-------|------------|----------|
| `gpt-4o` | Medium | Best | Complex tasks, reasoning |
| `gpt-4o-mini` | Fast | Good | Simple automation, speed priority |

---

## Anthropic

### Setup

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Open Iris Settings
3. Select **Provider**: Anthropic
4. Enter your API key
5. Choose a model (default: `claude-sonnet-4-6`)

### Configuration

```json
{
  "provider": "anthropic",
  "endpoint": "https://api.anthropic.com/v1",
  "model": "claude-sonnet-4-6",
  "apiKey": "sk-ant-..."
}
```

### Recommended Models

| Model | Speed | Capability | Best For |
|-------|-------|------------|----------|
| `claude-sonnet-4-6` | Medium | Excellent | Complex reasoning, long context |
| `claude-haiku-4-5` | Fast | Good | Quick tasks, cost optimization |

### Note

Anthropic uses a different API structure. Iris handles the conversion automatically, but some features may behave differently.

---

## Ollama (Local)

### Setup

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Run Ollama and pull models:
   ```bash
   ollama pull llama3
   ollama pull qwen2
   ```
3. Ensure Ollama is running (default: `http://localhost:11434`)
4. Open Iris Settings
5. Select **Provider**: Ollama
6. Choose a model (default: `llama3`)

### Configuration

```json
{
  "provider": "ollama",
  "endpoint": "http://localhost:11434/v1",
  "model": "llama3",
  "apiKey": ""
}
```

### Advantages

- **Privacy**: No data leaves your machine
- **Cost**: No API fees
- **Offline**: Works without internet

### Limitations

- Requires local compute resources
- Slower for complex tasks (depends on GPU)
- Limited to downloaded models

---

## Custom Provider

For self-hosted models or API proxies.

### Setup

1. Set up your API endpoint (e.g., local LLM server, API proxy)
2. Ensure it's OpenAI-compatible
3. Open Iris Settings
4. Select **Provider**: Custom
5. Enter the endpoint URL
6. Enter your API key (if required)
7. Specify the model name

### Configuration

```json
{
  "provider": "custom",
  "endpoint": "https://your-api.com/v1",
  "model": "your-model",
  "apiKey": "your-key"
}
```

### Compatible Services

- [LiteLLM](https://litellm.ai/) - Unified API proxy
- [LocalAI](https://localai.io/) - Self-hosted LLM
- [Jan](https://jan.ai/) - Local AI platform
- [llama.cpp](https://github.com/ggerganov/llama.cpp) with server mode

---

## Environment Variables

For advanced setup, you can use environment variables:

```bash
# In Chrome launch args (for development)
--disable-extensions-except=/path/to/extension
--load-extension=/path/to/extension

# Or set via wxt.config.ts
```

---

## Troubleshooting

### "Invalid API Key"

- Verify your API key is correct
- Check that your account has credits/API access
- For OpenAI: ensure billing is set up

### "Model not found"

- Check the model name is correct
- Ensure the model is available for your account
- For Ollama: run `ollama list` to see installed models

### "Connection timeout"

- Check your internet connection
- For Ollama: ensure the service is running
- Try a different endpoint

### "Rate limit exceeded"

- Wait and retry
- Consider using a faster model
- For paid APIs: check your usage limits

---

## Security Best Practices

1. **Never share your API key**
2. **Use environment variables** for sensitive data (in production)
3. **Rotate keys regularly**
4. **Use read-only keys** when possible
5. **Monitor usage** in your provider dashboard

---

*See also: [Getting Started](getting-started.md), [Tools Reference](tools-reference.md)*