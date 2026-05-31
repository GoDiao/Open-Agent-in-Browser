import type { CDPClient } from '../../types'

export interface PageInfo {
  url: string
  title: string
  tabId: number
}

export async function navigate(cdp: CDPClient, tabId: number, url: string): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.navigate', { url })
}

export async function captureScreenshot(cdp: CDPClient, tabId: number): Promise<string> {
  const result = await cdp.sendCommand<{ data: string }>(tabId, 'Page.captureScreenshot', { format: 'png' })
  return result.data
}

export async function getFrameTree(cdp: CDPClient, tabId: number): Promise<Record<string, unknown>> {
  return cdp.sendCommand(tabId, 'Page.getFrameTree')
}

export async function reload(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.reload')
}

export async function goBack(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.goBack')
}

export async function goForward(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Page.goForward')
}
