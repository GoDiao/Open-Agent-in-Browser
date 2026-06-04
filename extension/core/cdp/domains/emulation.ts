import type { CDPClient } from '../../types'

export interface DeviceMetrics {
  width: number
  height: number
  deviceScaleFactor?: number
  mobile?: boolean
  screenWidth?: number
  screenHeight?: number
  positionX?: number
  positionY?: number
  [key: string]: unknown
}

export async function setDeviceMetricsOverride(
  cdp: CDPClient,
  tabId: number,
  metrics: DeviceMetrics,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setDeviceMetricsOverride', metrics)
}

export async function clearDeviceMetricsOverride(
  cdp: CDPClient,
  tabId: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.clearDeviceMetricsOverride')
}

export async function setUserAgentOverride(
  cdp: CDPClient,
  tabId: number,
  userAgent: string,
  acceptLanguage?: string,
  platform?: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setUserAgentOverride', {
    userAgent,
    acceptLanguage,
    platform,
  })
}

export async function setGeolocationOverride(
  cdp: CDPClient,
  tabId: number,
  latitude: number,
  longitude: number,
  accuracy?: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setGeolocationOverride', {
    latitude,
    longitude,
    accuracy: accuracy || 100,
  })
}

export async function clearGeolocationOverride(
  cdp: CDPClient,
  tabId: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.clearGeolocationOverride')
}

export async function setTimezoneOverride(
  cdp: CDPClient,
  tabId: number,
  timezoneId: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setTimezoneOverride', { timezoneId })
}

export async function setLocaleOverride(
  cdp: CDPClient,
  tabId: number,
  locale: string,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setLocaleOverride', { locale })
}

export async function setTouchEmulationEnabled(
  cdp: CDPClient,
  tabId: number,
  enabled: boolean,
  maxTouchPoints?: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setTouchEmulationEnabled', {
    enabled,
    maxTouchPoints: maxTouchPoints || 1,
  })
}

export async function setEmitTouchEventsForMouse(
  cdp: CDPClient,
  tabId: number,
  enabled: boolean,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setEmitTouchEventsForMouse', { enabled })
}

export async function setEmulatedMedia(
  cdp: CDPClient,
  tabId: number,
  media?: string,
  features?: Array<{ name: string; value: string }>,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setEmulatedMedia', { media, features })
}

export async function setCPUThrottlingRate(
  cdp: CDPClient,
  tabId: number,
  rate: number,
): Promise<void> {
  await cdp.sendCommand(tabId, 'Emulation.setCPUThrottlingRate', { rate })
}

// Predefined device profiles
export const DEVICES: Record<string, DeviceMetrics & { userAgent: string }> = {
  'iPhone 14': {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  'iPhone 14 Pro Max': {
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  'iPad': {
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    mobile: false,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  'Pixel 7': {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },
  'Galaxy S23': {
    width: 360,
    height: 780,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },
}

export async function emulateDevice(
  cdp: CDPClient,
  tabId: number,
  deviceName: string,
): Promise<void> {
  const device = DEVICES[deviceName]
  if (!device) {
    throw new Error(`Unknown device: ${deviceName}. Available: ${Object.keys(DEVICES).join(', ')}`)
  }

  const { userAgent, ...metrics } = device
  await setDeviceMetricsOverride(cdp, tabId, metrics)
  await setUserAgentOverride(cdp, tabId, userAgent)
  await setTouchEmulationEnabled(cdp, tabId, metrics.mobile || false)
}
