import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import type { ServiceState } from '@/renderer/store/appStore'

interface StatusBadgeProps extends ComponentProps<'div'> {
  state: ServiceState
  showText?: boolean
}

export function StatusBadge({ state, showText = true, className, ...props }: StatusBadgeProps) {
  let colorClass = 'bg-gray-400'
  let label = 'Inconnu'
  let isPulsing = false

  if (state === 'running') {
    colorClass = 'bg-green-500'
    label = 'En cours'
    isPulsing = true
  } else if (state === 'stopped') {
    colorClass = 'bg-red-500'
    label = 'Arrêté'
  }

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className={cn("w-2.5 h-2.5 rounded-full", colorClass, isPulsing && "animate-pulse")} />
      {showText && <span className="text-xs font-medium">{label}</span>}
    </div>
  )
}
