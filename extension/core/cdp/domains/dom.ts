import type { CDPClient } from '../../types'

export interface DOMNode {
  nodeId: number
  nodeName: string
  nodeType: number
  nodeValue?: string
  children?: DOMNode[]
  attributes?: Record<string, string>
  backendNodeId?: number
}

export async function getDocument(cdp: CDPClient, tabId: number): Promise<DOMNode> {
  const result = await cdp.sendCommand<{ root: DOMNode }>(tabId, 'DOM.getDocument', { depth: -1 })
  return result.root
}

export async function querySelector(cdp: CDPClient, tabId: number, nodeId: number, selector: string): Promise<number> {
  const result = await cdp.sendCommand<{ nodeId: number }>(tabId, 'DOM.querySelector', { nodeId, selector })
  return result.nodeId
}

export async function getOuterHTML(cdp: CDPClient, tabId: number, nodeId: number): Promise<string> {
  const result = await cdp.sendCommand<{ outerHTML: string }>(tabId, 'DOM.getOuterHTML', { nodeId })
  return result.outerHTML
}

export async function getAttributes(cdp: CDPClient, tabId: number, nodeId: number): Promise<Record<string, string>> {
  const result = await cdp.sendCommand<{ attributes: string[] }>(tabId, 'DOM.getAttributes', { nodeId })
  const attrs: Record<string, string> = {}
  for (let i = 0; i < result.attributes.length; i += 2) {
    attrs[result.attributes[i]] = result.attributes[i + 1]
  }
  return attrs
}

export async function getBoxModel(cdp: CDPClient, tabId: number, nodeId: number): Promise<number[] | null> {
  try {
    const result = await cdp.sendCommand<{ model: { content: number[] } }>(tabId, 'DOM.getBoxModel', { nodeId })
    return result.model.content
  } catch {
    return null
  }
}
