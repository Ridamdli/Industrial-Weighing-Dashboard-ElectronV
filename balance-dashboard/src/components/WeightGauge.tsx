import { useAppStore } from '@/renderer/store/appStore'
import { cn } from '@/lib/utils'

export function WeightGauge({ error }: { error: string | null }) {
  const { weight, unit, serviceState } = useAppStore()

  const isRunning = serviceState === 'running'
  const isIdle = !!error && (error.includes('Inactif') || error.includes('attente'))
  const isRealError = (!!error && !isIdle) || !isRunning

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 rounded-xl border-4 transition-colors",
      isRealError ? "border-destructive/50 bg-destructive/5" :
      isIdle     ? "border-amber-400/60 bg-amber-50/30" :
                   "border-primary/20 bg-card"
    )}>
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Poids Actuel
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-7xl font-bold font-mono tracking-tighter",
          isRealError ? "text-destructive/50" :
          isIdle      ? "text-amber-400/70" :
                        "text-foreground"
        )}>
          {(isRealError || isIdle) ? '---.--' : weight.toFixed(2)}
        </span>
        <span className={cn(
          "text-3xl font-semibold",
          isRealError ? "text-destructive/50" :
          isIdle      ? "text-amber-400/70" :
                        "text-muted-foreground"
        )}>
          {unit}
        </span>
      </div>

      {isIdle && isRunning && (
        <div className="mt-4 text-sm text-amber-600 font-medium bg-amber-100/50 px-3 py-1 rounded-md">
          {error}
        </div>
      )}
      {isRealError && error && isRunning && (
        <div className="mt-4 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1 rounded-md">
          {error}
        </div>
      )}
      {!isRunning && (
        <div className="mt-4 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1 rounded-md">
          Service arrêté ou hors ligne
        </div>
      )}
    </div>
  )
}
