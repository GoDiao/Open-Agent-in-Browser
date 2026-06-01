import type { CDPClient } from '../../types'

export interface ConsoleMessage {
  level: string
  text: string
  url?: string
  line?: number
}

export async function enable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Console.enable')
}

export async function disable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Console.disable')
}
