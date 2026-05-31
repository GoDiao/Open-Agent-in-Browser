import type { ExtensionMessage } from '../core/types'

export function sendMessage(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message)
}

export function onMessage(
  callback: (message: ExtensionMessage, sender: chrome.runtime.MessageSender) => void,
): void {
  chrome.runtime.onMessage.addListener(callback)
}

export function sendMessageToTab(tabId: number, message: ExtensionMessage): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, message)
}
