import type { HTMLAttributes } from 'react'
import { cn } from '../../../lib/utils'

type ShimmerProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean
}

export function Shimmer({ active = false, className, children, ...props }: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        active && 'shimmer-active',
        className,
      )}
      {...props}
    >
      {children}
      {active && (
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer-sweep"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(var(--primary-rgb, 0, 180, 180), 0.06) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  )
}
