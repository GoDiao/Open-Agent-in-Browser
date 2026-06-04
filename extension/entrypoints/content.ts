import { getSelectedTextMap, setSelectedText } from '../lib/storage'

const MAX_SELECTED_TEXT_LENGTH = 5000
const MAX_NETWORK_REQUESTS = 100
const NETWORK_STORAGE_KEY = 'agent_network_requests'

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    let tabId: number | null = null

    const isContextValid = () => {
      try {
        return !!chrome?.runtime?.id
      } catch {
        return false
      }
    }

    // Get our own tab ID from background (content scripts don't have chrome.tabs.query)
    try {
      chrome.runtime.sendMessage({ type: 'get-tab-id' }, (response) => {
        if (response?.tabId && typeof response.tabId === 'number') {
          tabId = response.tabId
          // Initialize network tracking after getting tab ID
          initNetworkTracking(tabId!)
        }
      })
    } catch {
      // Extension context invalidated — silently ignore
    }

    // ── Network Request Tracking ──
    function initNetworkTracking(tabId: number) {
      // Use Performance API to capture network requests
      const captureRequests = () => {
        if (!isContextValid()) return

        try {
          const entries = performance.getEntriesByType('resource')
          const requests = entries.slice(-MAX_NETWORK_REQUESTS).map(entry => {
            const timing = entry as PerformanceResourceTiming
            return {
              name: entry.name,
              initiatorType: timing.initiatorType || 'other',
              transferSize: timing.transferSize || 0,
              duration: entry.duration,
              startTime: entry.startTime,
            }
          })

          // Store to chrome.storage.local
          chrome.storage.local.set({
            [NETWORK_STORAGE_KEY]: {
              tabId,
              requests,
              timestamp: Date.now(),
            }
          }).catch(() => {})
        } catch {
          // Ignore errors
        }
      }

      // Capture on page load
      if (document.readyState === 'complete') {
        captureRequests()
      } else {
        window.addEventListener('load', captureRequests)
      }

      // Capture periodically for dynamic requests
      const intervalId = setInterval(captureRequests, 2000)

      // Cleanup on unload
      window.addEventListener('unload', () => {
        clearInterval(intervalId)
      })
    }

    // ── Text Selection Tracking ──
    document.addEventListener('mouseup', async () => {
      if (tabId == null || !isContextValid()) return

      try {
        const selection = window.getSelection()?.toString().trim()

        if (selection && selection.length > 0) {
          const text = selection.slice(0, MAX_SELECTED_TEXT_LENGTH)
          await setSelectedText(String(tabId), {
            text,
            pageUrl: window.location.href,
            pageTitle: document.title,
            tabId,
            timestamp: Date.now(),
          })
        } else {
          // Clicked without selecting — clear this tab's selection
          const map = await getSelectedTextMap()
          if (map[String(tabId)]) {
            const { [String(tabId)]: _, ...rest } = map
            await chrome.storage.local.set({ selectedTextMap: rest })
          }
        }
      } catch {
        // Extension context invalidated — silently ignore
      }
    })
  },
})
