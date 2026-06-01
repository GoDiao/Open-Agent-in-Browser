import { AgentLoop } from '../core/agent/loop'
import { getConfig } from '../lib/storage'
import type { ChatMessage, ExtensionMessage } from '../core/types'

let agent: AgentLoop | null = null
let activeConversationId: string | null = null

function sendToUI(message: Record<string, unknown>) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Sidepanel not open — ignore
  })
}

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
    (message: ExtensionMessage | { type: string; [key: string]: unknown }, _sender, sendResponse) => {
      if (message.type === 'chat:send') {
        const chatMsg = message as Extract<ExtensionMessage, { type: 'chat:send' }>
        activeConversationId = chatMsg.conversationId || null
        handleChatMessage(chatMsg.text, chatMsg.history || [])
        sendResponse({ ok: true })
      } else if (message.type === 'open-sidepanel') {
        const msg = message as { type: 'open-sidepanel'; message?: string; conversationId?: string }
        // Open the sidepanel on the active tab, then optionally send a message
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0]
          if (tab?.id) {
            chrome.sidePanel.open({ tabId: tab.id }).then(() => {
              if (msg.message) {
                // Delay slightly to let sidepanel initialize
                setTimeout(() => {
                  sendToUI({
                    type: 'sidepanel:action',
                    message: msg.message,
                    conversationId: msg.conversationId,
                  })
                }, 300)
              }
            })
          }
        })
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
        sendToUI({ type: 'chat:stream', chunk })
      },
      onToolCall: (name, args) => {
        sendToUI({ type: 'chat:tool_call', name, args })
      },
      onToolResult: (name, result) => {
        sendToUI({ type: 'chat:tool_result', name, result })
      },
      onDone: () => {
        sendToUI({ type: 'chat:done' })
      },
      onError: (error) => {
        sendToUI({ type: 'chat:error', error })
      },
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    sendToUI({ type: 'chat:error', error })
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
