import { AgentLoop } from '../core/agent/loop'
import { getConfig } from '../lib/storage'
import type { ChatMessage, ExtensionMessage } from '../core/types'
import { getScheduledTasks, updateScheduledTask, syncAlarms } from '../lib/scheduler'
import { reviewAndExtractMemory } from '../core/agent/memory-review'

let agent: AgentLoop | null = null
let activeConversationId: string | null = null
let memoryReviewTimer: ReturnType<typeof setTimeout> | null = null

function sendToUI(message: Record<string, unknown>) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Sidepanel not open — ignore
  })
}

function broadcastToContentScripts(message: Record<string, unknown>) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab may not have content script — ignore
        })
      }
    }
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
      } else if (message.type === 'get-tab-id') {
        const tabId = _sender.tab?.id || null
        sendResponse({ tabId })
      } else if (message.type === 'open-sidepanel') {
        const msg = message as { type: 'open-sidepanel'; message?: string; conversationId?: string }
        // Store pending action for sidepanel to pick up (if it's not open yet)
        if (msg.conversationId || msg.message) {
          chrome.storage.session.set({
            pendingSidepanelAction: {
              message: msg.message,
              conversationId: msg.conversationId,
              timestamp: Date.now(),
            },
          })
          // Also send directly in case sidepanel is already open
          if (msg.message) {
            sendToUI({ type: 'sidepanel:send', message: msg.message })
          }
        }
        // Open the sidepanel on the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0]
          if (tab?.id) {
            chrome.sidePanel.open({ tabId: tab.id })
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

    // Start glow overlay on all tabs
    if (activeConversationId) {
      broadcastToContentScripts({
        conversationId: activeConversationId,
        isActive: true,
      })
    }

    const newMessages = await agentLoop.run(text, history, {
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
        // Stop glow overlay
        if (activeConversationId) {
          broadcastToContentScripts({
            conversationId: activeConversationId,
            isActive: false,
          })
        }
      },
      onError: (error) => {
        sendToUI({ type: 'chat:error', error })
        // Stop glow overlay
        if (activeConversationId) {
          broadcastToContentScripts({
            conversationId: activeConversationId,
            isActive: false,
          })
        }
      },
    })

    // Background memory review — debounced (only runs after last turn in conversation)
    if (memoryReviewTimer) clearTimeout(memoryReviewTimer)
    const fullHistory = [...history, ...newMessages]
    const configForReview = agentLoop.config
    memoryReviewTimer = setTimeout(() => {
      reviewAndExtractMemory(fullHistory, configForReview).catch(() => {})
    }, 30_000) // 30s debounce — only reviews after conversation goes idle
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    sendToUI({ type: 'chat:error', error })
    // Stop glow overlay
    if (activeConversationId) {
      broadcastToContentScripts({
        conversationId: activeConversationId,
        isActive: false,
      })
    }
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

  // Handle scheduled tasks
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    const tasks = await getScheduledTasks()
    const task = tasks.find(t => t.id === alarm.name && t.enabled)
    if (!task) return

    // Update last run time
    await updateScheduledTask(task.id, { lastRun: Date.now() })

    // Execute the task prompt
    try {
      const agentLoop = await getAgent()
      const history: ChatMessage[] = []

      await agentLoop.run(task.prompt, history, {
        onStream: () => {},
        onToolCall: () => {},
        onToolResult: () => {},
        onDone: () => {},
        onError: () => {},
      })

      // If one-time task, disable after execution
      if (task.schedule.type === 'once') {
        await updateScheduledTask(task.id, { enabled: false })
      }
    } catch (err) {
      console.error(`Scheduled task "${task.name}" failed:`, err)
    }
  })

  // Sync alarms on startup
  syncAlarms()
})
