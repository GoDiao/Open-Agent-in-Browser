import type { CDPClient } from '../../types'

export interface RequestInfo {
  url: string
  method: string
  status?: number
  type?: string
  requestId?: string
  timestamp?: number
  headers?: Record<string, string>
  postData?: string
}

export async function enable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.enable')
}

export async function disable(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.disable')
}

// Fetch domain for request interception
export async function enableFetch(
  cdp: CDPClient,
  tabId: number,
  patterns?: Array<{ urlPattern: string; requestStage: 'Request' | 'Response' }>,
): Promise<void> {
  const params = patterns
    ? { patterns }
    : { patterns: [{ urlPattern: '*', requestStage: 'Request' as const }] }
  await cdp.sendCommand(tabId, 'Fetch.enable', params)
}

export async function disableFetch(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Fetch.disable')
}

export async function fulfillRequest(
  cdp: CDPClient,
  tabId: number,
  requestId: string,
  responseCode: number,
  responseHeaders: Array<{ name: string; value: string }>,
  body: string,
): Promise<void> {
  const base64Body = btoa(body)
  await cdp.sendCommand(tabId, 'Fetch.fulfillRequest', {
    requestId,
    responseCode,
    responseHeaders,
    body: base64Body,
  })
}

export async function continueRequest(
  cdp: CDPClient,
  tabId: number,
  requestId: string,
  overrides?: {
    url?: string
    method?: string
    postData?: string
    headers?: Array<{ name: string; value: string }>,
  },
): Promise<void> {
  await cdp.sendCommand(tabId, 'Fetch.continueRequest', {
    requestId,
    ...overrides,
  })
}

export async function failRequest(
  cdp: CDPClient,
  tabId: number,
  requestId: string,
  reason:
    | 'Failed'
    | 'Aborted'
    | 'TimedOut'
    | 'AccessDenied'
    | 'ConnectionClosed'
    | 'ConnectionReset'
    | 'ConnectionRefused'
    | 'ConnectionFailed'
    | 'NameNotResolved'
    | 'InternetDisconnected'
    | 'AddressUnreachable'
    | 'BlockedByClient'
    | 'BlockedByResponse',
): Promise<void> {
  await cdp.sendCommand(tabId, 'Fetch.failRequest', { requestId, reason })
}

export async function continueWithAuth(
  cdp: CDPClient,
  tabId: number,
  requestId: string,
  authChallengeResponse: {
    response: 'Default' | 'CancelAuth' | 'ProvideCredentials'
    username?: string
    password?: string
  },
): Promise<void> {
  await cdp.sendCommand(tabId, 'Fetch.continueWithAuth', {
    requestId,
    authChallengeResponse,
  })
}

// Network domain extras
export async function setCacheDisabled(
  cdp: CDPClient,
  tabId: number,
  disabled: boolean,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.setCacheDisabled', { cacheDisabled: disabled })
}

export async function emulateNetworkConditions(
  cdp: CDPClient,
  tabId: number,
  offline: boolean,
  latency: number = 0,
  downloadThroughput: number = -1,
  uploadThroughput: number = -1,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.emulateNetworkConditions', {
    offline,
    latency,
    downloadThroughput,
    uploadThroughput,
  })
}

export async function setExtraHTTPHeaders(
  cdp: CDPClient,
  tabId: number,
  headers: Record<string, string>,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.setExtraHTTPHeaders', { headers })
}
