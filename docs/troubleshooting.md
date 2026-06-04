# Troubleshooting Guide

Solutions to common issues with Iris.

## Installation Issues

### Extension Not Loading

**Symptoms**: Iris doesn't appear in Chrome after loading

**Solutions**:
1. Ensure Developer mode is enabled in `chrome://extensions/`
2. Check for any error messages in the extensions page
3. Try removing and reloading the extension
4. Make sure you're using Chrome or a Chromium-based browser

### Build Fails

**Symptoms**: `bun run build` fails with errors

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules bun.lockb
bun install

# Run type check to find issues
bun run compile
```

---

## Configuration Issues

### "No API Key" Error

**Symptoms**: Settings show API key is required

**Solutions**:
1. Open Settings (gear icon)
2. Enter your API key for your chosen provider
3. Save and try again

### Invalid API Key

**Symptoms**: "Invalid API key" or authentication errors

**Solutions**:
1. Verify your API key is correct (no extra spaces)
2. Check that your account has credits/API access
3. For OpenAI: ensure billing is configured
4. For Anthropic: verify organization has API access

### Provider Connection Failed

**Symptoms**: "Connection failed" or timeout errors

**Solutions**:
- **OpenAI/Anthropic**: Check internet connection
- **Ollama**: Ensure `ollama serve` is running locally
- **Custom**: Verify endpoint URL is correct

---

## Tool Execution Issues

### Tool Fails to Execute

**Symptoms**: Tool runs but shows error, or doesn't respond

**Solutions**:
1. Reload the target page and retry
2. Check the active tab is fully loaded
3. Verify the selector/element exists
4. Check console for error details

### Element Not Found

**Symptoms**: "Element not found" or similar errors

**Solutions**:
1. Page may have changed - re-snapshot the page
2. Element may be in an iframe - try `switch_to_frame`
3. Element may require scrolling into view
4. Element may require waiting for load

### Click Doesn't Work

**Symptoms**: Click tool runs but nothing happens

**Solutions**:
1. Element may not be clickable (disabled, obscured)
2. Try using `scroll` to bring element into view
3. Element may be in shadow DOM
4. Try using JavaScript click: `evaluate_script`

---

## Memory & State Issues

### Memory Not Persisting

**Symptoms**: Memory entries disappear after reload

**Solutions**:
1. Check chrome.storage.local has permissions
2. Verify no storage quota exceeded
3. Check console for storage errors

### Memory Review Not Working

**Symptoms**: Automatic memory extraction doesn't happen

**Solutions**:
1. Check Settings: Privacy → Auto Memory Review is enabled
2. Ensure conversation has ended (30s after last message)
3. Memory extraction requires active LLM interaction

---

## Performance Issues

### Slow Response

**Symptoms**: Commands take a long time to execute

**Solutions**:
1. Switch to a faster model (e.g., gpt-4o-mini)
2. Check network latency to LLM provider
3. Reduce conversation history (fewer messages)
4. For Ollama: ensure GPU acceleration

### Extension Crashes

**Symptoms**: Extension stops responding

**Solutions**:
1. Reload the extension
2. Clear extension storage: `chrome://settings/clearBrowserData`
3. Check for conflicting extensions
4. Review console for errors

---

## Browser-Specific Issues

### Chrome vs Edge Differences

| Feature | Chrome | Edge |
|---------|--------|------|
| Debugger API | Full support | Full support |
| Sidepanel | Full support | Full support |
| Manifest V3 | Full support | Full support |

### Headless Mode

Some features may not work in headless Chrome:
- Screenshot tools
- Visual element detection
- Click coordinates

---

## Data & Export Issues

### Export Not Working

**Symptoms**: Export button does nothing

**Solutions**:
1. Check browser download permissions
2. Try a different export target
3. Check console for JavaScript errors

### Import Fails

**Symptoms**: Import shows errors or data doesn't load

**Solutions**:
1. Verify JSON format is correct
2. Check version compatibility
3. Ensure required fields are present

---

## Getting Help

If these solutions don't resolve your issue:

1. **Check GitHub Issues**: https://github.com/iris-agent/iris/issues
2. **Search Discussions**: https://github.com/iris-agent/iris/discussions
3. **Report a Bug**: Include:
   - Browser version
   - Iris version
   - Steps to reproduce
   - Error messages
   - Console logs

---

## Debug Mode

To enable debug logging:

1. Open Chrome with debug flags:
   ```
   chrome.exe --enable-logging --v=1
   ```

2. Check logs in:
   ```
   %LOCALAPPDATA%\Google\Chrome\User Data\crashpad\reports
   ```

---

*See also: [Getting Started](getting-started.md), [Architecture](architecture.md)*