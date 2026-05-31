import type { CDPClient } from '../types'

export class ChromeDebuggerClient implements CDPClient {
  private attached = new Set<number>()

  async attach(tabId: number): Promise<void> {
    if (this.attached.has(tabId)) return
    await chrome.debugger.attach({ tabId }, '1.3')
    this.attached.add(tabId)
  }

  async detach(tabId: number): Promise<void> {
    if (!this.attached.has(tabId)) return
    try {
      await chrome.debugger.detach({ tabId })
    } catch {
      // Already detached
    }
    this.attached.delete(tabId)
  }

  isAttached(tabId: number): boolean {
    return this.attached.has(tabId)
  }

  async sendCommand<T = unknown>(
    tabId: number,
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.attached.has(tabId)) {
      await this.attach(tabId)
    }
    const result = await chrome.debugger.sendCommand(
      { tabId },
      method,
      params,
    )
    return result as T
  }

  async ensureAttached(tabId: number): Promise<void> {
    if (!this.attached.has(tabId)) {
      await this.attach(tabId)
    }
  }

  async detachAll(): Promise<void> {
    for (const tabId of this.attached) {
      try {
        await chrome.debugger.detach({ tabId })
      } catch {
        // Ignore
      }
    }
    this.attached.clear()
  }
}

export function createCDPClient(): CDPClient {
  return new ChromeDebuggerClient()
}
