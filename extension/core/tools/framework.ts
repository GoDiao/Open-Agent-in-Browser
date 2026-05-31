import type { z } from 'zod'
import { toJSONSchema } from 'zod'
import type { ToolContext, ToolDefinition, ToolResponse } from '../types'

export function defineTool<
  TInput extends z.ZodType,
>(config: {
  name: string
  description: string
  input: TInput
  handler: (
    args: z.infer<TInput>,
    ctx: ToolContext,
    response: ToolResponse,
  ) => Promise<void>
}): ToolDefinition {
  return config as ToolDefinition
}

export function toolToJsonSchema(tool: ToolDefinition): Record<string, unknown> {
  const jsonSchema = toJSONSchema(tool.input)
  // Strip fields not expected by OpenAI function calling format
  const { $schema, additionalProperties, ...parameters } = jsonSchema as Record<string, unknown>
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters,
    },
  }
}
