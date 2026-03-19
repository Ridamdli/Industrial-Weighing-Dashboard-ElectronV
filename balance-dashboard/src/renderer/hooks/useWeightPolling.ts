import { useEffect, useRef } from 'react'
import { balanceApi } from '../api/balanceApi'
import { useAppStore } from '../store/appStore'

export function useWeightPolling(intervalMs = 1000) {
  const { setWeight, setApiState, timestamp: lastAppTimestamp } = useAppStore()
  // Use a ref to always access the latest store values inside the polling loop without retriggering useEffect
  const lastTimestampRef = useRef(lastAppTimestamp)

  useEffect(() => {
    lastTimestampRef.current = lastAppTimestamp
  }, [lastAppTimestamp])

  useEffect(() => {
    let isActive = true
    let timeoutId: NodeJS.Timeout | null = null

    const poll = async () => {
      try {
        const res = await balanceApi.balance.getWeight()
        if (!isActive) return

        if (res.ok) {
          const body = res.body as Record<string, unknown>
          const w = body?.weight ?? body?.poids
          const u = body?.unit ?? body?.unite ?? 'kg'
          const responseTimestamp = body?.timestemp ?? body?.timestamp ?? new Date().toISOString()
          
          if (typeof w === 'number') {
            const currentTimestamp = String(responseTimestamp)
            
            // Only update the store (triggering UI/Chart update) if the timestamp has actually changed
            // This prevents duplicate pushes to the LiveWeightChart and redundant rerenders
            if (lastTimestampRef.current !== currentTimestamp) {
              setWeight(w, String(u), currentTimestamp)
            }
            
            setApiState('connected')
          } else {
            console.warn('[useWeightPolling] Invalid data format received', body)
            setApiState('error', 'Format de données invalide')
          }
        } else {
          const errMsg = (res.body as Record<string, unknown>)?.['message'] as string || `Erreur API: ${res.status}`
          
          if (errMsg.toLowerCase().includes('aborted') || errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('déconnect')) {
            console.debug(`[useWeightPolling] Balance is inactive/timeout: ${errMsg}`)
            setApiState('idle', 'En attente de la balance (Inactif)')
          } else {
            setApiState('error', errMsg)
          }
        }
      } catch (err) {
        if (!isActive) return
        const errorString = err instanceof Error ? err.message : String(err)
        console.error(`[useWeightPolling] Fetch disconnected/failed: ${errorString}`)
        // Network errors or Service down
        setApiState('disconnected', errorString)
      } finally {
        if (isActive) {
          // Recursive setTimeout ensures no overlapping fetch calls.
          timeoutId = setTimeout(poll, intervalMs)
        }
      }
    }

    // Start strict polling loop
    poll()

    return () => {
      isActive = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [intervalMs, setWeight, setApiState])
}
