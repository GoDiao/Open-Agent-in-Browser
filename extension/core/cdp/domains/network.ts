import type { CDPClient } from '../../types'

export interface RequestInfo {
  url: string
  method: string
  status?: number
  type?: string
}

export async function enable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.enable')
}

export async function disable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.disable')
}
