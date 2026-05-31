import type { CDPClient } from '../../types'

export interface EvaluateResult {
  result?: string
  error?: string
  exceptionDetails?: Record<string, unknown>
}

export async function evaluate(cdp: CDPClient, tabId: number, expression: string): Promise<EvaluateResult> {
  const result = await cdp.sendCommand<{
    result?: { value?: string; type?: string }
    exceptionDetails?: { text: string }
  }>(tabId, 'Runtime.evaluate', { expression, returnByValue: true })

  if (result.exceptionDetails) {
    return { error: result.exceptionDetails.text }
  }

  return {
    result: result.result?.value !== undefined ? String(result.result.value) : undefined,
  }
}
