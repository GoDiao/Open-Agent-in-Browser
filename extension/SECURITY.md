# Security Considerations

This document explains the security aspects of Iris, including permissions, data storage, and best practices for protecting your data.

## Chrome Debugger Permission

Iris uses the `chrome.debugger` API, which provides full access to Chrome DevTools Protocol (CDP). This is the same protocol used by Chrome's built-in developer tools.

### What This Means

- **Full Page Access**: Iris can read and modify any page's DOM, execute JavaScript, and intercept network requests
- **Sensitive Data Exposure**: Pages may contain sensitive information (passwords, personal data, cookies)
- **Man-in-Middle Capability**: The debugger can intercept and modify all network traffic

### Why This Permission Is Required

Unlike traditional extensions that use content scripts, Iris provides deep browser automation capabilities through CDP. This enables:
- Precise DOM element selection and interaction
- Network request interception and modification
- JavaScript execution in page context
- Console log access and injection

### Security Implications

1. **Trust Requirement**: You must trust the Iris extension code—review source if self-hosting
2. **Data at Rest**: All page data accessible via CDP is also accessible to Iris
3. **Network Traffic**: Iris can inspect, modify, or block any HTTP/HTTPS request
4. **Extension Permissions**: Malicious extensions with debugger access could capture significant data

## Data Storage

### Where Data Is Stored

All Iris data is stored locally in your browser using `chrome.storage.local`:

| Data Type | Storage Key | Description |
|-----------|-------------|-------------|
| **User Profile** | `memory_user` | Name, email, timezone, preferences |
| **Notes** | `memory` | User notes and context |
| **SOUL Config** | `soul_config` | AI personality settings |
| **Conversations** | `conversations` | Chat history |
| **Settings** | `config` | API keys, preferences |
| **History** | `history` | Tool execution records |

### Data Location

- **Chrome**: `chrome://version/` → Extensions → Iris → Storage
- **Data Path**: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Extension Storage\`

### Data Access

- **No Cloud Sync**: All data stays local to your browser profile
- **Profile Isolation**: Data is tied to your Chrome profile
- **No Server Communication**: Except for LLM API calls you explicitly make

## API Key Security

### Best Practices

1. **Never Share Your API Key**: Your key grants access to your LLM account
2. **Use Environment Variables**: For development, prefer environment-based configuration
3. **Restrict API Keys**: Create keys with minimal permissions (read-only when possible)
4. **Rotate Keys Regularly**: Periodically regenerate your API keys
5. **Review Usage Logs**: Check your LLM provider dashboard for unusual activity

### Recommended Providers

| Provider | Security Features |
|----------|-------------------|
| **OpenAI** | API key management dashboard, usage alerts |
| **Anthropic** | API key management, organization controls |
| **Ollama** | Local-only (no external API calls) |

### Storing API Keys

Iris stores API keys in `chrome.storage.local` (not localStorage). This provides:
- **Extension Isolation**: Only Iris can access these keys
- **No Sync to Cloud**: Not synced to your Google Account
- **Encrypted Storage**: Chrome encrypts extension storage

**However**: Any extension with `storage` permission can read these keys. Only install extensions you trust.

## User Responsibilities

### What You Should Do

1. **Review Before Installing**: Check the code, understand permissions
2. **Keep Extensions Updated**: Update Iris when new versions are released
3. **Use Reputable LLM Providers**: Choose providers with strong security track records
4. **Monitor API Usage**: Check your LLM provider dashboard regularly
5. **Revoke Unused Keys**: Remove API keys you no longer need

### What You Should Avoid

1. **Don't Install Untrusted Extensions**: Avoid extensions from unknown developers
2. **Don't Share Screenshots**: Don't share screenshots that reveal API keys or sensitive data
3. **Don't Use on Public Computers**: Avoid using Iris on shared or public devices
4. **Don't Ignore Security Warnings**: Pay attention to Chrome security warnings

## Reporting Security Issues

If you discover a security vulnerability in Iris, please:

1. **Don't Open a Public Issue**: Security issues should not be disclosed publicly
2. **Contact Directly**: Reach out through GitHub security advisories
3. **Provide Details**: Include reproduction steps and potential impact

## Privacy

For complete privacy information, see [PRIVACY.md](PRIVACY.md).

---

*Last updated: June 2026*