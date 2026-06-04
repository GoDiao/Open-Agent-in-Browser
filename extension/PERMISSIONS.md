# Permissions Reference

This document explains each permission required by Iris and why it's needed.

## Manifest Permissions

```json
{
  "permissions": [
    "activeTab",
    "debugger",
    "storage",
    "tabs",
    "bookmarks",
    "history",
    "tabGroups",
    "downloads",
    "scripting",
    "alarms"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

## Permission Details

### debugger

**Purpose**: Full Chrome DevTools Protocol (CDP) access

**Required For**:
- DOM inspection and manipulation
- Network request interception
- JavaScript execution in page context
- Console log access
- Input simulation (type, click, scroll)

**Risk Level**: High — provides equivalent access to Chrome DevTools

**Why Required**: Unlike content scripts (which have limited capabilities), CDP enables precise automation. This is essential for tools like `query_selector`, `click_element`, `get_network_requests`, etc.

---

### storage

**Purpose**: Local data persistence

**Required For**:
- User profile and memory storage
- Conversation history
- Settings and API keys
- SOUL configuration (AI personality)

**Risk Level**: Low — data stays local to your browser profile

---

### tabs

**Purpose**: Tab management

**Required For**:
- Reading active tab URL and title
- Creating new tabs
- Closing tabs
- Switching between tabs

**Risk Level**: Medium — can open/close/manage tabs

---

### activeTab

**Purpose**: Access to the currently active tab

**Required For**:
- Injecting content scripts
- Getting tab information when user activates Iris

**Risk Level**: Low — only accesses the tab the user is actively viewing

---

### sidePanel

**Purpose**: Sidepanel UI

**Required For**:
- Displaying the main Iris interface in the sidepanel

**Risk Level**: None — UI-only permission

---

### bookmarks

**Purpose**: Bookmark read/write

**Required For**:
- `get_bookmarks` tool
- `add_bookmark` tool
- Listing and creating bookmarks via AI

**Risk Level**: Medium — can read and modify bookmarks

---

### history

**Purpose**: Browser history access

**Required For**:
- `search_history` tool
- `get_recent_urls` tool
- AI-powered history search

**Risk Level**: Medium — can read browsing history

---

### tabGroups

**Purpose**: Tab group management

**Required For**:
- Organizing tabs into groups
- Moving tabs between groups

**Risk Level**: Low — organizational feature only

---

### downloads

**Purpose**: Download management

**Required For**:
- `download_file` tool
- Triggering file downloads from AI

**Risk Level**: Medium — can initiate downloads

---

### scripting

**Purpose**: Script injection

**Required For**:
- Injecting content scripts for automation
- Running user scripts in page context

**Risk Level**: Medium — can execute JavaScript in pages

---

### alarms

**Purpose**: Scheduled tasks

**Required For**:
- `schedule_task` tool
- Recurring reminders
- Background task scheduling

**Risk Level**: None — scheduling only

---

### host_permissions: `<all_urls>`

**Purpose**: Access all websites

**Required For**:
- DOM automation on any page
- Network request interception for any site
- Reading page content universally

**Risk Level**: High — can interact with any website

**Why Required**: Browser automation must work on any page the user visits. This is standard for automation extensions.

---

## Permission Minimization

If you're concerned about permissions:

1. **Review Source Code**: All CDP operations are defined in `core/cdp/`
2. **Audit Tools**: Tool definitions in `core/tools/` show exactly what each tool does
3. **Use Ollama**: Running a local Ollama instance avoids sending data to external APIs

## Requesting New Permissions

If a future feature requires new permissions:

1. The extension will prompt for approval in Chrome
2. Permissions will be listed in `manifest.json`
3. A changelog entry will document the change