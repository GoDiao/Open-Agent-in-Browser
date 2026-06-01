import { MessageToolCall } from './ai-elements/message'

interface Props {
  name: string
  args: string
}

export function ToolResult({ name }: Props) {
  return (
    <div className="px-4 pb-2 animate-fade-in-up">
      <MessageToolCall name={name} state="running" />
    </div>
  )
}
