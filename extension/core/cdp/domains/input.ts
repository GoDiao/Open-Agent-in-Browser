import type { CDPClient } from '../../types'

export async function dispatchMouseEvent(
  cdp: CDPClient, tabId: number,
  type: 'mousePressed' | 'mouseReleased' | 'mouseMoved',
  x: number, y: number,
  button: 'left' | 'right' | 'middle' = 'left',
): Promise<void> {
  await cdp.sendCommand(tabId, 'Input.dispatchMouseEvent', {
    type, x, y, button,
    clickCount: type === 'mousePressed' || type === 'mouseReleased' ? 1 : 0,
  })
}

export async function click(cdp: CDPClient, tabId: number, x: number, y: number): Promise<void> {
  await dispatchMouseEvent(cdp, tabId, 'mousePressed', x, y)
  await dispatchMouseEvent(cdp, tabId, 'mouseReleased', x, y)
}

export async function dispatchKeyEvent(
  cdp: CDPClient, tabId: number,
  type: 'keyDown' | 'keyUp' | 'char',
  text?: string, key?: string,
): Promise<void> {
  const params: Record<string, unknown> = { type }
  if (text) params.text = text
  if (key) params.key = key
  await cdp.sendCommand(tabId, 'Input.dispatchKeyEvent', params)
}

export async function insertText(cdp: CDPClient, tabId: number, text: string): Promise<void> {
  await cdp.sendCommand(tabId, 'Input.insertText', { text })
}
