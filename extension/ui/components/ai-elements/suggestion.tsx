import type { HTMLAttributes } from 'react'
import { cn } from '../../../lib/utils'

export type SuggestionsProps = HTMLAttributes<HTMLDivElement>

export const Suggestions = ({ className, ...props }: SuggestionsProps) => (
  <div
    className={cn('grid w-full max-w-[240px] gap-2', className)}
    {...props}
  />
)

export type SuggestionProps = HTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode
}

export const Suggestion = ({
  children,
  icon,
  className,
  ...props
}: SuggestionProps) => (
  <button
    type="button"
    className={cn(
      'group flex items-center justify-between rounded-xl border border-border/50 bg-card px-3.5 py-2.5 text-left text-xs transition-all duration-200',
      'hover:border-accent-orange/50 hover:bg-accent-orange/5',
      className,
    )}
    {...props}
  >
    <span className="text-foreground">{children}</span>
    {icon && (
      <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-accent-orange">
        {icon}
      </span>
    )}
  </button>
)
