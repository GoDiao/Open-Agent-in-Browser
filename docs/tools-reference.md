# Iris Tools Reference

This document lists all 67 tools available in Iris for browser automation.

## Categories

- [Navigation](#navigation) - Page navigation and tab management
- [DOM & Elements](#dom--elements) - DOM querying and element interaction
- [Input](#input) - Mouse, keyboard, and scroll actions
- [Snapshot](#snapshot) - Screenshot and page content capture
- [Network](#network) - Request interception and modification
- [Storage](#storage) - Cookies and local/session storage
- [Emulation](#emulation) - Viewport, geolocation, user agent
- [Bookmarks](#bookmarks) - Bookmark CRUD operations
- [History](#history) - Browser history access
- [Downloads](#downloads) - File and PDF download
- [Windows & Tabs](#windows--tabs) - Window and tab group management
- [Console](#console) - Console log access
- [Memory & Soul](#memory--soul) - Persistent memory and AI personality

---

## Navigation

| Tool | Description |
|------|-------------|
| `navigate` | Navigate to a URL |
| `list_pages` | List all open tabs |
| `new_page` | Open a new tab |
| `close_page` | Close the current tab |
| `go_back` | Navigate back in history |
| `go_forward` | Navigate forward in history |
| `reload` | Reload the current page |

---

## DOM & Elements

| Tool | Description |
|------|-------------|
| `get_dom` | Get the full DOM tree |
| `search_dom` | Search for elements by selector |
| `read_file_from_page` | Read file input elements |
| `get_page_links` | Extract all links from page |
| `get_page_images` | Extract all images from page |
| `extract_structured_data` | Extract structured data using schema |
| `download_text` | Download text content from page |

---

## Input

| Tool | Description |
|------|-------------|
| `click` | Click an element |
| `fill` | Type text into an input |
| `hover` | Hover over an element |
| `scroll` | Scroll the page |

---

## Snapshot

| Tool | Description |
|------|-------------|
| `take_screenshot` | Take a screenshot of the page |
| `take_snapshot` | Get a full page snapshot |
| `get_page_content` | Get page HTML or text |
| `evaluate_script` | Execute JavaScript in page context |

---

## Network

| Tool | Description |
|------|-------------|
| `get_network_requests` | Get recent network requests |
| `block_requests` | Block requests matching a pattern |
| `mock_response` | Mock response for a URL pattern |
| `set_network_conditions` | Set network throttling (offline, slow 3G) |
| `set_extra_headers` | Add custom HTTP headers |
| `disable_cache` | Enable/disable browser cache |

---

## Storage

| Tool | Description |
|------|-------------|
| `get_cookies` | Get cookies for the current domain |
| `set_cookie` | Set a cookie |
| `delete_cookies` | Delete specific cookies |
| `clear_cookies` | Clear all cookies for domain |
| `get_local_storage` | Get localStorage data |
| `set_local_storage` | Set localStorage data |
| `remove_local_storage` | Remove localStorage item |
| `get_session_storage` | Get sessionStorage data |

---

## Emulation

| Tool | Description |
|------|-------------|
| `emulate_device` | Emulate a device (iPhone, iPad, etc.) |
| `list_devices` | List available device presets |
| `set_viewport` | Set viewport size |
| `set_geolocation` | Set geolocation coordinates |
| `set_timezone` | Set timezone |
| `emulate_media` | Emulate media features (dark mode, etc.) |
| `set_user_agent` | Set custom user agent |
| `throttle_cpu` | Throttle CPU ( slowdown factor) |

---

## Bookmarks

| Tool | Description |
|------|-------------|
| `create_bookmark` | Create a new bookmark |
| `search_bookmarks` | Search bookmarks |
| `get_bookmarks` | Get all bookmarks |
| `update_bookmark` | Update a bookmark |
| `remove_bookmark` | Remove a bookmark |
| `move_bookmark` | Move a bookmark to a folder |

---

## History

| Tool | Description |
|------|-------------|
| `search_history` | Search browser history |
| `get_recent_history` | Get recent browsing history |
| `delete_history_url` | Delete specific URL from history |
| `delete_history_range` | Delete history in a date range |

---

## Downloads

| Tool | Description |
|------|-------------|
| `download_file` | Download a file from URL |
| `save_pdf` | Save page as PDF |
| `save_screenshot` | Save screenshot to file |

---

## Windows & Tabs

| Tool | Description |
|------|-------------|
| `list_windows` | List all windows |
| `create_window` | Open a new window |
| `close_window` | Close a window |
| `focus_window` | Focus a specific window |
| `create_tab_group` | Create a tab group |
| `list_tab_groups` | List all tab groups |
| `close_tab_group` | Close a tab group |

---

## Console

| Tool | Description |
|------|-------------|
| `get_console_logs` | Get console logs from page |

---

## Memory & Soul

| Tool | Description |
|------|-------------|
| `update_memory` | Add, update, or remove memory entries |
| `update_soul` | Update AI personality configuration |

---

## Usage Example

```bash
# Navigate to a website
Navigate to example.com

# Click a button
Click the login button

# Extract data
Get all links from the page

# Take a screenshot
Take a screenshot

# Search history
Search history for github.com
```

---

## Adding Custom Tools

To add a new tool, create a new file in `core/tools/` or add to an existing file:

```typescript
import { z } from 'zod'
import { defineTool } from './framework'

export const my_tool = defineTool({
  name: 'my_tool',
  description: 'What the tool does',
  input: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async (args, ctx, response) => {
    // Implementation
    response.text('Result')
  },
})
```

Then register it in `core/agent/loop.ts`:

```typescript
import { my_tool } from '../tools/my-tool'

// In registerTools():
registry.set(my_tool.name, my_tool)
```

---

*See also: [Architecture](architecture.md), [API Configuration](api-config.md)*