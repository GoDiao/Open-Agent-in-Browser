import { useEffect, useState } from 'react'

interface Props {
  name: string
  args: string
}

export function ToolResult({ name, args }: Props) {
  const [formattedArgs, setFormattedArgs] = useState('')

  useEffect(() => {
    try {
      const parsed = JSON.parse(args)
      setFormattedArgs(JSON.stringify(parsed))
    } catch {
      setFormattedArgs(args)
    }
  }, [args])

  return (
    <div className="mx-3 my-2 border border-primary/20 bg-primary/[0.02] p-2 font-mono text-[11px] leading-normal text-foreground">
      {/* 状态帧头部：模拟工业监控器的系统时间戳与通道 */}
      <div className="flex items-center justify-between border-b border-primary/10 pb-1 text-primary opacity-80">
        <span className="font-bold tracking-wider">[ IRIS_CORE_CDP ]</span>
        <span className="animate-pulse">● ACTIVE_SESSION</span>
      </div>

      {/* 数据流：冷峻地展示当前凝视和操作的 DOM 目标 */}
      <div className="mt-1.5 space-y-0.5">
        <div className="flex gap-1.5">
          <span className="text-muted-foreground">→ PROCESS:</span>
          <span className="text-primary font-bold">{name.toUpperCase()}</span>
        </div>
        {formattedArgs && (
          <div className="flex gap-1.5 overflow-hidden">
            <span className="text-muted-foreground">→ TARGET:</span>
            <span className="truncate max-w-[240px] opacity-90 text-foreground">{formattedArgs}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-primary/70 pt-0.5">
          <span>&gt; EXECUTING_COMMAND</span>
          {/* 永不熄灭的闪烁光标，作为机械之眼的图腾 */}
          <span className="inline-block w-1 h-3 bg-primary animate-[flare_0.8s_infinite]" />
        </div>
      </div>
    </div>
  )
}