import { useState } from 'react'
import { Play, Square, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { balanceApi } from '../api/balanceApi'
import { StatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

export function ServiceControl() {
  const { serviceState, setServiceState, servicePendingAction, setServicePendingAction } = useAppStore()
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    if (servicePendingAction) return // Block if already operating
    
    // Map the button action to the actual pending state
    const actionToState = {
      start: 'starting',
      stop: 'stopping',
      restart: 'restarting'
    } as const
    setServicePendingAction(actionToState[action])
    setError(null)
    try {
      let res
      switch (action) {
        case 'start': res = await balanceApi.service.start(); break;
        case 'stop': res = await balanceApi.service.stop(); break;
        case 'restart': res = await balanceApi.service.restart(); break;
      }
      
      if (!res.success) {
        setError(res.error || 'Erreur inconnue')
      } else {
        // Trigger an immediate manual status check to sync UI
        const statusRes = await balanceApi.service.status()
        const validStates = ['running', 'stopped', 'unknown'] as const
        const newState = validStates.includes(statusRes.state) ? statusRes.state : 'unknown'
        setServiceState(newState)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setServicePendingAction(null)
    }
  }

  const isRunning = serviceState === 'running'
  const isStopped = serviceState === 'stopped'
  const isPending = servicePendingAction !== null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrôle du Service</h1>
        <p className="text-muted-foreground mt-2">
          Gérer le service Windows .NET (BalanceAgentService) en arrière-plan.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">État du service</h3>
            <p className="text-sm text-muted-foreground">État actuel du processus d'arrière-plan</p>
          </div>
          <div className="flex items-center gap-3">
             {isPending && (
              <span className="text-sm font-medium text-primary animate-pulse flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {servicePendingAction === 'starting' && 'Démarrage en cours...'}
                {servicePendingAction === 'stopping' && 'Arrêt en cours...'}
                {servicePendingAction === 'restarting' && 'Redémarrage...'}
              </span>
            )}
            <StatusBadge state={serviceState} className={cn("px-4 py-2 border border-border rounded-full", isPending && "opacity-50")} />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive flex items-center gap-3 p-4 rounded-lg text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="break-all">{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <button
            onClick={() => handleAction('start')}
            disabled={isPending || isRunning}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors border",
              isPending || isRunning 
                ? "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50" 
                : "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {servicePendingAction === 'starting' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Démarrer
          </button>
          
          <button
            onClick={() => handleAction('stop')}
            disabled={isPending || isStopped}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors border",
              isPending || isStopped
                ? "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50" 
                : "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {servicePendingAction === 'stopping' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            Arrêter
          </button>
          
          <button
            onClick={() => handleAction('restart')}
            disabled={isPending}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors border",
              isPending 
                ? "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50" 
                : "bg-card border-border hover:bg-accent hover:text-accent-foreground align-middle"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", servicePendingAction === 'restarting' && "animate-spin")} /> Redémarrer
          </button>
        </div>
      </div>
    </div>
  )
}
