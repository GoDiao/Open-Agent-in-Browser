import { getSelectedTextMap, setSelectedText } from '../lib/storage'

const MAX_SELECTED_TEXT_LENGTH = 5000

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    let tabId: number | null = null

    // Get our own tab ID from background (content scripts don't have chrome.tabs.query)
    chrome.runtime.sendMessage({ type: 'get-tab-id' }, (response) => {
      if (response?.tabId) {
        tabId = response.tabId
      }
    })

    document.addEventListener('mouseup', async () => {
      if (tabId == null) return

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
    })
  },
})
