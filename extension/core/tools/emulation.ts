import { z } from 'zod'
import * as EmulationDomain from '../cdp/domains/emulation'
import { defineTool } from './framework'

export const emulate_device = defineTool({
  name: 'emulate_device',
  description: 'Emulate a mobile device (iPhone, iPad, Pixel, Galaxy). Call with no args to reset.',
  input: z.object({
    device: z.string().optional().describe('Device name (e.g., "iPhone 14", "Pixel 7"). Omit to reset.'),
  }),
  handler: async (args, ctx, response) => {
    if (!args.device) {
      await EmulationDomain.clearDeviceMetricsOverride(ctx.cdp, ctx.tabId)
      response.text('Reset to default viewport')
      return
    }
    await EmulationDomain.emulateDevice(ctx.cdp, ctx.tabId, args.device)
    response.text(`Emulating: ${args.device}`)
  },
})

export const list_devices = defineTool({
  name: 'list_devices',
  description: 'List available device emulation profiles',
  input: z.object({}),
  handler: async (_args, _ctx, response) => {
    const devices = Object.entries(EmulationDomain.DEVICES).map(
      ([name, d]) => `${name} — ${d.width}x${d.height}, DPR ${d.deviceScaleFactor}${d.mobile ? ', mobile' : ''}`,
    )
    response.text(`Available devices:\n\n${devices.join('\n')}`)
  },
})

export const set_viewport = defineTool({
  name: 'set_viewport',
  description: 'Set custom viewport size',
  input: z.object({
    width: z.number().describe('Viewport width in pixels'),
    height: z.number().describe('Viewport height in pixels'),
    deviceScaleFactor: z.number().optional().describe('Device pixel ratio (default: 1)'),
  }),
  handler: async (args, ctx, response) => {
    await EmulationDomain.setDeviceMetricsOverride(ctx.cdp, ctx.tabId, {
      width: args.width,
      height: args.height,
      deviceScaleFactor: args.deviceScaleFactor || 1,
    })
    response.text(`Viewport set to ${args.width}x${args.height}`)
  },
})

export const set_geolocation = defineTool({
  name: 'set_geolocation',
  description: 'Override geolocation coordinates. Call with no args to reset.',
  input: z.object({
    latitude: z.number().optional().describe('Latitude (-90 to 90)'),
    longitude: z.number().optional().describe('Longitude (-180 to 180)'),
    accuracy: z.number().optional().describe('Accuracy in meters (default: 100)'),
  }),
  handler: async (args, ctx, response) => {
    if (args.latitude == null || args.longitude == null) {
      await EmulationDomain.clearGeolocationOverride(ctx.cdp, ctx.tabId)
      response.text('Geolocation reset to default')
      return
    }
    await EmulationDomain.setGeolocationOverride(
      ctx.cdp,
      ctx.tabId,
      args.latitude,
      args.longitude,
      args.accuracy,
    )
    response.text(`Geolocation set to ${args.latitude}, ${args.longitude}`)
  },
})

export const set_timezone = defineTool({
  name: 'set_timezone',
  description: 'Override timezone. Call with no args to reset.',
  input: z.object({
    timezone: z.string().optional().describe('Timezone ID (e.g., "America/New_York", "Asia/Tokyo")'),
  }),
  handler: async (args, ctx, response) => {
    if (!args.timezone) {
      await EmulationDomain.setTimezoneOverride(ctx.cdp, ctx.tabId, '')
      response.text('Timezone reset to default')
      return
    }
    await EmulationDomain.setTimezoneOverride(ctx.cdp, ctx.tabId, args.timezone)
    response.text(`Timezone set to ${args.timezone}`)
  },
})

export const emulate_media = defineTool({
  name: 'emulate_media',
  description: 'Emulate CSS media type (screen, print, etc.)',
  input: z.object({
    media: z.enum(['screen', 'print', '']).describe('Media type, empty to reset'),
  }),
  handler: async (args, ctx, response) => {
    await EmulationDomain.setEmulatedMedia(ctx.cdp, ctx.tabId, args.media || undefined)
    response.text(args.media ? `Emulating media: ${args.media}` : 'Media emulation reset')
  },
})

export const set_user_agent = defineTool({
  name: 'set_user_agent',
  description: 'Override the browser user agent string',
  input: z.object({
    userAgent: z.string().describe('User agent string'),
  }),
  handler: async (args, ctx, response) => {
    await EmulationDomain.setUserAgentOverride(ctx.cdp, ctx.tabId, args.userAgent)
    response.text(`User agent set: ${args.userAgent.slice(0, 80)}...`)
  },
})

export const throttle_cpu = defineTool({
  name: 'throttle_cpu',
  description: 'Simulate slow CPU. Rate 1 = normal, 2 = 2x slower, etc. Set 1 to reset.',
  input: z.object({
    rate: z.number().describe('Throttling rate (1 = normal, 4 = 4x slower)'),
  }),
  handler: async (args, ctx, response) => {
    await EmulationDomain.setCPUThrottlingRate(ctx.cdp, ctx.tabId, args.rate)
    response.text(args.rate === 1 ? 'CPU throttling disabled' : `CPU throttled to ${args.rate}x slower`)
  },
})
