import { useEffect, useState } from 'react'
import { balanceApi } from '../api/balanceApi'
import { useAppStore } from '../store/appStore'

export function useWeightPolling(intervalMs = 1000) {
  const [error, setError] = useState<string | null>(null)
  const setWeight = useAppStore(s => s.setWeight)

  useEffect(() => {
    let isActive = true
    
    const poll = async () => {
      try {
        const res = await balanceApi.balance.getWeight()
        if (!isActive) return

        if (res.ok) {
          const body = res.body as Record<string, unknown>
          if (body && typeof body.poids === 'number') {
            setWeight(body.poids as number, String(body.unite ?? 'kg'), new Date().toISOString())
            setError(null)
          } else {
            setError('Format de données invalide')
          }
        } else {
          setError((res.body as Record<string, unknown>)?.['message'] as string || `Erreur API: ${res.status}`)
        }
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : String(err))
      }
    }

    poll() // initial
    const t = setInterval(poll, intervalMs)
    
    return () => {
      isActive = false
      clearInterval(t)
    }
  }, [intervalMs, setWeight])

  return { error }
}
