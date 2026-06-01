import type { ToolDefinition } from '../types'

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()
  private disabled = new Set<string>()

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  all(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  names(): string[] {
    return Array.from(this.tools.keys())
  }

  setEnabled(name: string, enabled: boolean): void {
    if (enabled) {
      this.disabled.delete(name)
    } else {
      this.disabled.add(name)
    }
  }

  isEnabled(name: string): boolean {
    return !this.disabled.has(name)
  }

  getEnabled(): ToolDefinition[] {
    return this.all().filter((t) => this.isEnabled(t.name))
  }
}

export function createRegistry(): ToolRegistry {
  return new ToolRegistry()
}
