import { AgentLoop } from '../core/agent/loop'
import { getConfig } from '../lib/storage'
import type { ChatMessage, ExtensionMessage } from '../core/types'

let agent: AgentLoop | null = null

async function getAgent(): Promise<AgentLoop> {
  if (!agent) {
    const config = await getConfig()
    if (!config.apiKey) {
      throw new Error('API key not configured. Open settings to set your API key.')
    }
    agent = new AgentLoop(config)
  }
  return agent
}

// Handle messages from UI
function setupMessageListener() {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      if (message.type === 'chat:send') {
        handleChatMessage(message.text, message.history || [])
        sendResponse({ ok: true })
      }
      return true // Keep message channel open
    },
  )
}

async function handleChatMessage(text: string, history: ChatMessage[]) {
  try {
    const agentLoop = await getAgent()

    await agentLoop.run(text, history, {
      onStream: (chunk) => {
        chrome.runtime.sendMessage({ type: 'chat:stream', chunk })
      },
      onToolCall: (name, args) => {
        chrome.runtime.sendMessage({ type: 'chat:tool_call', name, args })
      },
      onToolResult: (name, result) => {
        chrome.runtime.sendMessage({ type: 'chat:tool_result', name, result })
      },
      onDone: () => {
        chrome.runtime.sendMessage({ type: 'chat:done' })
      },
      onError: (error) => {
        chrome.runtime.sendMessage({ type: 'chat:error', error })
      },
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    chrome.runtime.sendMessage({ type: 'chat:error', error })
  }
}

export default defineBackground(() => {
  setupMessageListener()

  // Open sidepanel on extension icon click
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id })
    }
  })

  // Reset agent when config changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.config) {
      agent = null
    }
  })
})
