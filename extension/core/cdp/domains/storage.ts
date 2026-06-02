import type { CDPClient } from '../../types'

export interface Cookie {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  size: number
  httpOnly: boolean
  secure: boolean
  session: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export async function getCookies(
  cdp: CDPClient,
  tabId: number,
  urls?: string[],
): Promise<Cookie[]> {
  const params = urls ? { urls } : {}
  const result = await cdp.sendCommand<{ cookies: Cookie[] }>(tabId, 'Network.getCookies', params)
  return result.cookies
}

export async function setCookie(
  cdp: CDPClient,
  tabId: number,
  cookie: {
    name: string
    value: string
    domain?: string
    path?: string
    expires?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  },
): Promise<boolean> {
  const result = await cdp.sendCommand<{ success: boolean }>(tabId, 'Network.setCookie', cookie)
  return result.success
}

export async function deleteCookies(
  cdp: CDPClient,
  tabId: number,
  name: string,
  domain?: string,
  path?: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.deleteCookies', { name, domain, path })
}

export async function clearBrowserCookies(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Network.clearBrowserCookies')
}

export async function getLocalStorage(
  cdp: CDPClient,
  tabId: number,
  origin?: string,
): Promise<Record<string, string>> {
  const expression = origin
    ? `(function() {
        try {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
          iframe.src = '${origin}';
          const storage = {};
          // Note: cross-origin access will fail
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            storage[key] = localStorage.getItem(key);
          }
          document.body.removeChild(iframe);
          return JSON.stringify(storage);
        } catch(e) {
          return JSON.stringify({error: e.message});
        }
      })()`
    : `(function() {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          storage[key] = localStorage.getItem(key);
        }
        return JSON.stringify(storage);
      })()`

  const result = await cdp.sendCommand<{ result: { value?: string } }>(
    tabId,
    'Runtime.evaluate',
    { expression, returnByValue: true },
  )
  try {
    return JSON.parse(result.result?.value || '{}')
  } catch {
    return {}
  }
}

export async function setLocalStorageItem(
  cdp: CDPClient,
  tabId: number,
  key: string,
  value: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Runtime.evaluate', {
    expression: `localStorage.setItem('${key.replace(/'/g, "\\'")}', '${value.replace(/'/g, "\\'")}')`,
  })
}

export async function removeLocalStorageItem(
  cdp: CDPClient,
  tabId: number,
  key: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Runtime.evaluate', {
    expression: `localStorage.removeItem('${key.replace(/'/g, "\\'")}')`,
  })
}

export async function clearLocalStorage(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Runtime.evaluate', {
    expression: 'localStorage.clear()',
  })
}

export async function getSessionStorage(
  cdp: CDPClient,
  tabId: number,
): Promise<Record<string, string>> {
  const expression = `(function() {
    const storage = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      storage[key] = sessionStorage.getItem(key);
    }
    return JSON.stringify(storage);
  })()`

  const result = await cdp.sendCommand<{ result: { value?: string } }>(
    tabId,
    'Runtime.evaluate',
    { expression, returnByValue: true },
  )
  try {
    return JSON.parse(result.result?.value || '{}')
  } catch {
    return {}
  }
}

export async function clearSessionStorage(cdp: CDPClient, tabId: number): Promise<void> {
  await cdp.sendCommand(tabId, 'Runtime.evaluate', {
    expression: 'sessionStorage.clear()',
  })
}
