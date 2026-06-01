import { createCDPClient } from '../cdp/client'
import { createRegistry } from '../tools/registry'
import type { ChatMessage, CDPClient, LLMConfig, ToolCall, ToolDefinition, ToolResult } from '../types'
import { ToolResponse } from '../types'
import { buildSystemPrompt } from './prompt'
import { createProvider } from './provider'

// Import all tools
import { close_page, go_back, go_forward, list_pages, navigate, new_page, reload } from '../tools/navigation'
import { evaluate_script, get_page_content, take_screenshot, take_snapshot } from '../tools/snapshot'
import { click, fill, hover, scroll } from '../tools/input'
import { create_bookmark, search_bookmarks, get_bookmarks, update_bookmark, remove_bookmark, move_bookmark } from '../tools/bookmarks'
import { search_history, get_recent_history, delete_history_url, delete_history_range } from '../tools/history'
import { list_windows, create_window, close_window, focus_window } from '../tools/windows'
import { create_tab_group, list_tab_groups, close_tab_group } from '../tools/tab-groups'
import { download_file, save_pdf, save_screenshot } from '../tools/downloads'
import { get_console_logs } from '../tools/console'
import { get_network_requests } from '../tools/network'
import { get_dom, search_dom } from '../tools/dom'
import { toolToJsonSchema } from '../tools/framework'

export interface AgentCallbacks {
  onStream: (text: string) => void
  onToolCall: (name: string, args: string) => void
  onToolResult: (name: string, result: ToolResult) => void
  onDone: () => void
  onError: (error: string) => void
  targetTabId?: number
}

export class AgentLoop {
  private cdp: CDPClient
  private registry = createRegistry()
  private provider

  constructor(config: LLMConfig) {
    this.cdp = createCDPClient()
    this.provider = createProvider(config)
    this.registerTools()
  }

  private registerTools(): void {
    const tools = [
      // Navigation (7)
      navigate, list_pages, new_page, close_page, go_back, go_forward, reload,
      // Snapshot (4)
      take_screenshot, take_snapshot, get_page_content, evaluate_script,
      // Input (4)
      click, fill, hover, scroll,
      // Bookmarks (6)
      create_bookmark, search_bookmarks, get_bookmarks, update_bookmark, remove_bookmark, move_bookmark,
      // History (4)
      search_history, get_recent_history, delete_history_url, delete_history_range,
      // Windows (4)
      list_windows, create_window, close_window, focus_window,
      // Tab Groups (3)
      create_tab_group, list_tab_groups, close_tab_group,
      // Downloads (3)
      download_file, save_pdf, save_screenshot,
      // Console (1)
      get_console_logs,
      // Network (1)
      get_network_requests,
      // DOM (2)
      get_dom, search_dom,
    ]
    for (const tool of tools) {
      this.registry.register(tool)
    }
  }

  async run(
    userMessage: string,
    history: ChatMessage[],
    callbacks: AgentCallbacks,
    signal?: AbortSignal,
  ): Promise<ChatMessage[]> {
    // Fetch active tab context for the system prompt
    let pageContext: { url: string; title: string } | undefined
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (activeTab?.url) {
        pageContext = { url: activeTab.url, title: activeTab.title || '' }
      }
    } catch {
      // Ignore errors fetching tab context
    }

    const systemPrompt = buildSystemPrompt(this.registry.getEnabled(), pageContext)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ]

    const newMessages: ChatMessage[] = [
      { role: 'user', content: userMessage },
    ]

    const tools = this.registry.getEnabled().map((t) => toolToJsonSchema(t))

    let maxIterations = 20 // Safety limit

    while (maxIterations-- > 0) {
      let assistantContent = ''
      const toolCallsToExecute: ToolCall[] = []

      try {
        await this.provider.streamChat(
          messages,
          tools,
          (text) => {
            assistantContent += text
            callbacks.onStream(text)
          },
          (toolCall) => {
            toolCallsToExecute.push(toolCall)
          },
          signal,
        )
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        callbacks.onError(errorMsg)
        break
      }

      // Add assistant message
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
      }
      if (toolCallsToExecute.length > 0) {
        assistantMsg.tool_calls = toolCallsToExecute
      }
      messages.push(assistantMsg)
      newMessages.push(assistantMsg)

      // If no tool calls, we're done
      if (toolCallsToExecute.length === 0) {
        callbacks.onDone()
        return newMessages
      }

      // Execute tool calls
      for (const tc of toolCallsToExecute) {
        callbacks.onToolCall(tc.function.name, tc.function.arguments)

        const result = await this.executeTool(tc, callbacks.targetTabId)

        callbacks.onToolResult(tc.function.name, result)

        const toolResultMsg: ChatMessage = {
          role: 'tool',
          tool_call_id: tc.id,
          content: result.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('\n'),
        }
        messages.push(toolResultMsg)
        newMessages.push(toolResultMsg)
      }
    }

    callbacks.onDone()
    return newMessages
  }

  private async executeTool(toolCall: ToolCall, targetTabId?: number): Promise<ToolResult> {
    const tool = this.registry.get(toolCall.function.name)
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolCall.function.name}` }],
        isError: true,
      }
    }

    // Get tab ID: use provided targetTabId, or fall back to active tab
    let tabId = targetTabId
    if (!tabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      tabId = activeTab?.id
    }
    if (!tabId) {
      return {
        content: [{ type: 'text', text: 'No active tab found' }],
        isError: true,
      }
    }

    const ctx = { cdp: this.cdp, tabId }
    const response = new ToolResponse()

    try {
      const args = JSON.parse(toolCall.function.arguments)
      await tool.handler(args, ctx, response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      response.error(`Tool error: ${msg}`)
    }

    return response.toResult()
  }
}
